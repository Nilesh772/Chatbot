import { dbService } from "./dbService";

interface FlowStepResult {
  messages: Array<{
    sender: "bot";
    text: string;
    nodeType: string;
    nodeId: string;
    options?: string[]; // for button/quick reply nodes
    fields?: any[]; // for form nodes
    mediaUrl?: string; // for image/video nodes
  }>;
  isEnd: boolean;
}

function replaceVariables(text: string, variables: any) {
  if (!text || !variables) return text;
  return text.replace(/{{(.*?)}}/g, (match, p1) => {
    const key = p1.trim();
    return variables[key] !== undefined ? variables[key] : match;
  });
}

export const flowEngine = {
  async executeStep(
    botId: string,
    sessionId: string,
    userText?: string,
    buttonIndex?: number
  ): Promise<FlowStepResult> {
    // 1. Get conversation
    const conversation = await dbService.findOrCreateConversation(botId, sessionId);
    if (!conversation) {
      return {
        messages: [{ sender: "bot", text: "Something went wrong. Conversation could not be initialized.", nodeType: "message", nodeId: "error" }],
        isEnd: true
      };
    }
    const messages = conversation.messages || [];

    // 2. Get flow (using active flow stored in session variables, or fall back to main flow)
    const vars = (conversation.variables as any) || {};
    let activeFlowId = vars._activeFlowId;
    let flow: any = null;
    if (activeFlowId) {
      flow = await dbService.getFlowById(activeFlowId);
    }
    if (!flow) {
      flow = await dbService.getFlowByBotId(botId);
      if (flow) {
        activeFlowId = flow.id;
        await dbService.updateConversationVariables(conversation.id, { _activeFlowId: activeFlowId });
        conversation.variables = { ...vars, _activeFlowId: activeFlowId };
      }
    }

    if (!flow || !flow.nodes || flow.nodes.length === 0) {
      return {
        messages: [{ sender: "bot", text: "Hi! My flow is not configured yet.", nodeType: "message", nodeId: "fallback" }],
        isEnd: true
      };
    }

    // Normalize nodes so that node.type represents the actual behavioral type (e.g. message, button)
    // rather than the React Flow generic "customNode".
    let nodes: any[] = flow.nodes.map((n: any) => ({
      ...n,
      type: n.data?.type ?? n.type
    }));
    let edges: any[] = (flow.edges as any[]) || [];

    // 3. Find where we are
    let currentNodeId = "node-start";
    let lastBotNodeId: string | null = null;

    // Find the last bot message to see where we paused
    const lastBotMessage = [...messages].reverse().find(m => m.sender === "bot");
    if (lastBotMessage) {
      try {
        const payload = typeof lastBotMessage.payload === "string" 
          ? JSON.parse(lastBotMessage.payload) 
          : lastBotMessage.payload;
        if (payload && payload.nodeId) {
          lastBotNodeId = payload.nodeId;
        }
      } catch (e) {
        // ignore
      }
    }

    // If we have a last bot node, we process the user's reply to that node
    if (lastBotNodeId) {
      // If there is no new user input, do not advance the flow.
      if (!userText && buttonIndex === undefined) {
        return { messages: [], isEnd: false };
      }
      const lastBotNode = nodes.find(n => n.id === lastBotNodeId);
      if (lastBotNode) {
        let savedValue = userText;
        if ((lastBotNode.type === "button" || lastBotNode.type === "list" || lastBotNode.type === "quick_reply") && buttonIndex !== undefined) {
           savedValue = lastBotNode.data?.options?.[buttonIndex] || userText;
        }

        // Save to variable & last_input
        const updates: any = {};
        if (savedValue) {
          updates.last_input = savedValue;
        }
        if (savedValue && lastBotNode.data?.variable) {
          updates[lastBotNode.data.variable] = savedValue;
        }
        if (Object.keys(updates).length > 0) {
          await dbService.updateConversationVariables(conversation.id, updates);
          conversation.variables = { ...((conversation.variables as any) || {}), ...updates };
        }

        // B. Find the next node.
        // If the node has multiple handles (like buttons or list), route based on input.
        if (lastBotNode.type === "button" || lastBotNode.type === "list" || lastBotNode.type === "quick_reply") {
          if (buttonIndex !== undefined) {
            const targetHandle = `option-${buttonIndex}`;
            const edge = edges.find(e => e.source === lastBotNodeId && e.sourceHandle === targetHandle);
            if (edge) {
              currentNodeId = edge.target;
            } else {
              const fallbackEdge = edges.find(e => e.source === lastBotNodeId && e.sourceHandle === "default");
              currentNodeId = fallbackEdge ? fallbackEdge.target : "end";
            }
          } else {
            // User typed text instead of clicking a button -> check if Default handle is connected
            const defaultEdge = edges.find((e: any) => e.source === lastBotNodeId && e.sourceHandle === "default");
            if (defaultEdge) {
              currentNodeId = defaultEdge.target;
            } else {
              // No Default path connected — remind user to click a button
              return {
                messages: [{ sender: "bot" as const, text: "Please select one of the options above by clicking a button. ☝️", nodeType: "message", nodeId: lastBotNodeId + "_hint" }],
                isEnd: false,
              };
            }
          }
        } else if (lastBotNode.type === "question") {
           // Mock validation: 
           let isValid = true;
           const inputType = lastBotNode.data?.inputType || "Text";
           if (inputType === "Email" && savedValue && !savedValue.includes("@")) isValid = false;
           if (inputType === "Number" && savedValue && isNaN(Number(savedValue))) isValid = false;
           
           if (isValid) {
             const edge = edges.find(e => e.source === lastBotNodeId && (!e.sourceHandle || e.sourceHandle === "success"));
             currentNodeId = edge ? edge.target : "end";
           } else {
             const failEdge = edges.find(e => e.source === lastBotNodeId && e.sourceHandle === "validation_failed");
             currentNodeId = failEdge ? failEdge.target : "end";
           }
        } else {
          // Standard single connection node
          const edge = edges.find(e => e.source === lastBotNodeId && (!e.sourceHandle || e.sourceHandle === "success"));
          if (edge) {
            currentNodeId = edge.target;
          } else {
            // Fallback for nodes that don't have sourceHandle set explicitly
            const fallbackEdge = edges.find(e => e.source === lastBotNodeId);
            currentNodeId = fallbackEdge ? fallbackEdge.target : "end";
          }
        }
      }
    } else {
      // Starting fresh.
      const startNode = nodes.find(n => n.type === "start") || nodes[0];
      const startAutomatically = startNode?.data?.startAutomatically !== false;
      
      if (!startAutomatically) {
        const cleanUserText = (userText || "").trim().toLowerCase();
        
        // If there's no user message (initial widget load), do not start the flow automatically
        if (!cleanUserText) {
          return { messages: [], isEnd: false };
        }

        const keywordsStr = startNode?.data?.triggerKeywords as string || "";
        const triggerKeywords = keywordsStr
          .split(",")
          .map(k => k.trim().toLowerCase())
          .filter(k => k);

        // If trigger keywords are specified, verify if userText matches any keyword
        if (triggerKeywords.length > 0) {
          const isMatched = triggerKeywords.some(keyword => cleanUserText === keyword);
          if (!isMatched) {
            // Did not match trigger keywords -> do not respond
            return { messages: [], isEnd: false };
          }
        }
      }

      // Find the node connected to the start node.
      const startEdge = edges.find(e => e.source === startNode.id);
      if (startEdge) {
        currentNodeId = startEdge.target;
      } else {
        // Try starting from first non-start node
        const firstRealNode = nodes.find(n => n.type !== "start");
        currentNodeId = firstRealNode ? firstRealNode.id : "end";
      }
    }

    // 4. Trace the flow and collect messages until we hit an input node or end
    const botResponses: any[] = [];
    let isEnd = false;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    while (currentNodeId && currentNodeId !== "end" && iterations < maxIterations) {
      iterations++;
      const node = nodes.find(n => n.id === currentNodeId);
      if (!node) break;

      // Handle different node types
      if (node.type === "end") {
        isEnd = true;
        break;
      }

      if (node.type === "message") {
        const text = replaceVariables(node.data?.text || "Hello!", conversation.variables);
        botResponses.push({
          sender: "bot",
          text,
          nodeType: node.type,
          nodeId: node.id
        });
        
        // Move to next node
        const edge = edges.find(e => e.source === node.id);
        currentNodeId = edge ? edge.target : "end";
      } 
      else if (node.type === "button" || node.type === "quick_reply" || node.type === "list") {
        // Buttons block the execution, wait for user click
        const text = replaceVariables(node.data?.text || "Please choose an option:", conversation.variables);
        const options = node.data?.options || [];
        botResponses.push({
          sender: "bot",
          text,
          nodeType: node.type,
          nodeId: node.id,
          options
        });
        break; // Pause execution
      } 
      else if (node.type === "image" || node.type === "video") {
        const text = node.data?.text || "";
        const mediaUrl = node.data?.url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400";
        botResponses.push({
          sender: "bot",
          text,
          nodeType: node.type,
          nodeId: node.id,
          mediaUrl
        });

        // Move to next node
        const edge = edges.find(e => e.source === node.id);
        currentNodeId = edge ? edge.target : "end";
      }
      else if (node.type === "condition") {
        const rules = node.data?.rules || [];
        const vars = (conversation.variables as any) || {};
        let matchedRuleIdx = -1;

        for (let i = 0; i < rules.length; i++) {
          const rule = rules[i];
          const varValue = String(vars[rule.variable] || "").toLowerCase().trim();
          const targetValues = String(rule.value || "").split(',').map(t => t.trim().toLowerCase()).filter(t => t);

          let isMatch = false;
                if (targetValues.length > 0) {
             const rawInput = userText ? String(userText).toLowerCase().trim() : "";
             switch(rule.operator) {
               case "Equals": isMatch = targetValues.some(t => varValue === t) || (!!rawInput && targetValues.some(t => rawInput === t)); break;
               case "Not Equals": isMatch = targetValues.every(t => varValue !== t) && (!rawInput || targetValues.every(t => rawInput !== t)); break;
               case "Contains": isMatch = targetValues.some(t => varValue.includes(t)) || (!!rawInput && targetValues.some(t => rawInput.includes(t))); break;
               case "Starts With": isMatch = targetValues.some(t => varValue.startsWith(t)) || (!!rawInput && targetValues.some(t => rawInput.startsWith(t))); break;
               case "Ends With": isMatch = targetValues.some(t => varValue.endsWith(t)) || (!!rawInput && targetValues.some(t => rawInput.endsWith(t))); break;
               case "Greater Than": isMatch = targetValues.some(t => !isNaN(Number(varValue)) && !isNaN(Number(t)) && Number(varValue) > Number(t)); break;
               case "Less Than": isMatch = targetValues.some(t => !isNaN(Number(varValue)) && !isNaN(Number(t)) && Number(varValue) < Number(t)); break;
               case "Greater Than Or Equal": isMatch = targetValues.some(t => !isNaN(Number(varValue)) && !isNaN(Number(t)) && Number(varValue) >= Number(t)); break;
               case "Less Than Or Equal": isMatch = targetValues.some(t => !isNaN(Number(varValue)) && !isNaN(Number(t)) && Number(varValue) <= Number(t)); break;
               case "Is Empty": isMatch = varValue === "" && rawInput === ""; break;
               case "Is Not Empty": isMatch = varValue !== "" || rawInput !== ""; break;
             }
           } else {
            // Fallback for empty target values if operator is checking for emptiness
            if (rule.operator === "Is Empty") isMatch = varValue === "";
            else if (rule.operator === "Is Not Empty") isMatch = varValue !== "";
          }

          if (isMatch) {
            matchedRuleIdx = i;
            break;
          }
        }

        let edge;
        if (matchedRuleIdx !== -1) {
          edge = edges.find(e => e.source === node.id && e.sourceHandle === `rule-${matchedRuleIdx}`);
        }
        
        if (!edge) {
          // Fallback to default
          edge = edges.find(e => e.source === node.id && e.sourceHandle === "default");
        }

        currentNodeId = edge ? edge.target : "end";
      }
      else if (node.type === "question") {
        // Question node blocks execution
        const text = replaceVariables(node.data?.text || "Please answer:", conversation.variables);
        botResponses.push({
          sender: "bot",
          text,
          nodeType: node.type,
          nodeId: node.id,
          payload: { inputType: node.data?.inputType || "Text" }
        });
        break; // Pause execution
      }
      else if (node.type === "name_input" || node.type === "email_input" || node.type === "phone_input" || node.type === "date_input") {
        // Input nodes block execution
        const text = replaceVariables(node.data?.text || `Please enter your ${node.type.split("_")[0]}:`, conversation.variables);
        botResponses.push({
          sender: "bot",
          text,
          nodeType: node.type,
          nodeId: node.id
        });
        break; // Pause execution
      }
      else if (node.type === "form") {
        const text = node.data?.text || "Please fill in the form:";
        const fields = node.data?.fields || [];
        botResponses.push({
          sender: "bot",
          text,
          nodeType: node.type,
          nodeId: node.id,
          fields
        });
        break; // Pause execution
      }
      else if (node.type === "redirect") {
        const text = node.data?.text || "Redirecting you...";
        const url = node.data?.url || "https://example.com";
        botResponses.push({
          sender: "bot",
          text: `${text} (Redirect to: ${url})`,
          nodeType: node.type,
          nodeId: node.id,
          payload: { redirectUrl: url }
        });
        // Move to next
        const edge = edges.find(e => e.source === node.id);
        currentNodeId = edge ? edge.target : "end";
      }
      else if (node.type === "whatsapp") {
        const text = node.data?.text || "Chat with us on WhatsApp:";
        const number = node.data?.number || "";
        botResponses.push({
          sender: "bot",
          text: `${text} (WhatsApp: ${number})`,
          nodeType: node.type,
          nodeId: node.id,
          payload: { whatsapp: number }
        });
        // Move to next
        const edge = edges.find(e => e.source === node.id);
        currentNodeId = edge ? edge.target : "end";
      }
      else if (node.type === "jump_to_flow") {
        const targetFlowId = node.data?.flowId;
        if (targetFlowId) {
          const targetFlow = await dbService.getFlowById(targetFlowId);
          if (targetFlow && targetFlow.nodes && targetFlow.nodes.length > 0) {
            await dbService.updateConversationVariables(conversation.id, { _activeFlowId: targetFlowId });
            conversation.variables = { ...((conversation.variables as any) || {}), _activeFlowId: targetFlowId };

            flow = targetFlow;
            nodes = targetFlow.nodes.map((n: any) => ({
              ...n,
              type: n.data?.type ?? n.type
            }));
            edges = (targetFlow.edges as any[]) || [];

            const startNode = nodes.find((n: any) => n.type === "start") || nodes[0];
            const startEdge = edges.find((e: any) => e.source === startNode.id);
            currentNodeId = startEdge ? startEdge.target : "end";
            continue;
          }
        }
        const edge = edges.find(e => e.source === node.id);
        currentNodeId = edge ? edge.target : "end";
      }
      else if (node.type === "delay") {
        // Visual node, just skip to next for execution
        const edge = edges.find(e => e.source === node.id);
        currentNodeId = edge ? edge.target : "end";
      }
      else {
        // Unknown or start node, just pass through
        const edge = edges.find(e => e.source === node.id);
        currentNodeId = edge ? edge.target : "end";
      }
    }

    // 5. Store bot responses in message history
    for (const res of botResponses) {
      await dbService.addMessage(
        conversation.id,
        "bot",
        res.text,
        {
          nodeId: res.nodeId,
          nodeType: res.nodeType,
          options: res.options,
          fields: res.fields,
          mediaUrl: res.mediaUrl,
          payload: res.payload
        }
      );
    }

    return {
      messages: botResponses,
      isEnd: isEnd || currentNodeId === "end"
    };
  },

  async processLeadCapture(botId: string, conversationId: string, node: any, value: string) {
    try {
      // Find existing lead for this conversation
      const leads = await dbService.getLeads(botId);
      const existingLead = leads.find(l => l.conversationId === conversationId);

      const leadData: any = {
        conversationId,
        source: typeof window !== "undefined" ? window.location.href : "Widget Website"
      };

      const nodeType = node.data?.type ?? node.type;
      if (nodeType === "name_input") {
        leadData.name = value;
      } else if (nodeType === "email_input") {
        leadData.email = value;
      } else if (nodeType === "phone_input") {
        leadData.mobile = value;
      } else if (nodeType === "form") {
        // Try parsing JSON if form values are passed as JSON
        try {
          const formValues = JSON.parse(value);
          if (formValues.name) leadData.name = formValues.name;
          if (formValues.email) leadData.email = formValues.email;
          if (formValues.mobile || formValues.phone) leadData.mobile = formValues.mobile || formValues.phone;
        } catch {
          // Fallback to text
          leadData.name = value;
        }
      }

      if (existingLead) {
        // Update existing lead (Merge)
        const updated = {
          ...existingLead,
          name: leadData.name || existingLead.name,
          email: leadData.email || existingLead.email,
          mobile: leadData.mobile || existingLead.mobile,
        };
        // Save using dbService.createLead (will update or insert)
        await dbService.createLead(botId, updated);
      } else {
        // Create new lead
        await dbService.createLead(botId, leadData);
      }
    } catch (e) {
      console.error("Failed to capture lead:", e);
    }
  }
};
