import { fetchCurrentUser, getAccessToken } from './employees-service.js';
import { connectMessageService, sendMessage, setCurrentChat } from './message-service.js';

const serverIp = window.location.hostname; // Автоматически берёт IP, с которого открыт сайт
const CHAT_API_URL = `http://${serverIp}:1006/api/v1/chats`;
let currentChat = null;
const chatsData = new Map();

async function getChatDetails(chatId) {
  const response = await fetch(`${CHAT_API_URL}/${chatId}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` }
  });
  return response.json();
}

async function updateChatData(chatId) {
  try {
    const chatDetails = await getChatDetails(chatId);
    const participants = chatDetails.participants || [];
    const currentUser = await fetchCurrentUser();
    
    chatsData.set(chatId, {
      ...chatDetails,
      interlocutor: participants.find(p => p.id !== currentUser?.id) || null
    });

  } catch (error) {
    console.error('Ошибка обновления данных чата:', error);
    throw error;
  }
}

export async function loadChatMessages(chatId) {
  try {
    currentChat = chatId;
    setCurrentChat(chatId);
    
    const messageContainer = document.querySelector('.message-container');
    if (!messageContainer) return;

    await updateChatData(chatId);
    
    const response = await fetch(`http://localhost:1006/api/v1/messages/chat/${chatId}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    });
    
    const messages = await response.json();
    messageContainer.innerHTML = '';

    const currentUser = await fetchCurrentUser();
    const chatData = chatsData.get(chatId);

    messages.forEach(msg => {
      const isOutgoing = msg.senderId === currentUser.id;
      messageContainer.innerHTML += `
        <div class="message ${isOutgoing ? 'outgoing' : ''}">
          ${!isOutgoing ? '<div class="message-avatar"></div>' : ''}
          <div class="message-content">
            <span>${msg.text}</span>
            <div class="message-time">
              ${new Date(msg.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      `;
    });
    
    messageContainer.scrollTop = messageContainer.scrollHeight;

  } catch (error) {
    console.error('Ошибка загрузки сообщений:', error);
  }
}

export async function loadUserChats() {
  try {
    const currentUser = await fetchCurrentUser();
    connectMessageService(currentUser.id);
    
    const response = await fetch(`${CHAT_API_URL}/user/${currentUser.id}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    });
    
    const chats = await response.json();
    const chatList = document.querySelector('.chat-list');
    chatList.innerHTML = '';

    chats.forEach(chat => {
      const interlocutor = chat.participants.find(p => p.id !== currentUser.id);
      chatsData.set(chat.id, { ...chat, interlocutor });
      
      const chatItem = document.createElement('div');
      chatItem.className = 'chat-item';
      chatItem.dataset.chatId = chat.id;
      chatItem.innerHTML = `
        <div class="chat-avatar"></div>
        <div class="chat-info">
          <h4>${chat.name || interlocutor?.name || 'Новый чат'}</h4>
        </div>
      `;
      
      chatItem.addEventListener('click', () => {
        currentChat = chat.id;
        loadChatMessages(chat.id);
      });
      
      chatList.appendChild(chatItem);
    });
  } catch (error) {
    console.error('Ошибка загрузки чатов:', error);
  }
}

async function fetchUserChats() {
  const currentUser = await fetchCurrentUser();
  const response = await fetch(`${CHAT_API_URL}/user/${currentUser.id}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` }
  });
  if (!response.ok) throw new Error('Ошибка загрузки чатов');
  return await response.json();
}

export async function openChatWithEmployee(employee) {
  try {
    const currentUser = await fetchCurrentUser();
    const userChats = await fetchUserChats();
    
    // Ищем существующий приватный чат с сотрудником
    const existingChat = userChats.find(chat => 
      !chat.is_group && 
      chat.participants.some(p => p.id === employee.id)
    );

    let chat;

    if (existingChat) {
      chat = existingChat;
      chatsData.set(chat.id, { ...chat, interlocutor: employee });
    } else {
      chat = await createChat(employee);
      chatsData.set(chat.id, { ...chat, interlocutor: employee });
      await loadUserChats(); // Обновляем список чатов в UI
    }

    if (chat) {
      currentChat = chat.id;
      setCurrentChat(chat.id);
      loadChatMessages(chat.id);
    }
  } catch (error) {
    console.error("Ошибка при открытии чата:", error);
  }
}

async function createChat(employee) {
  const currentUser = await fetchCurrentUser();
  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({
      name: '',
      is_group: false,
      participantIds: [currentUser.id, employee.id],
    }),
  });
  return response.json();
}

document.addEventListener('DOMContentLoaded', () => {
  loadUserChats();
  
  const allChatsBtn = document.getElementById('allChatsBtn');
  const sendButton = document.querySelector('.send-button');
  const messageInput = document.querySelector('.message-input');

  if (allChatsBtn) allChatsBtn.addEventListener('click', loadUserChats);

  async function handleSend() {
    const text = messageInput.value.trim();
    if (!text || !currentChat) return;

    try {
      const currentUser = await fetchCurrentUser();
      const chatData = chatsData.get(currentChat);

      if (!chatData?.interlocutor?.id) {
        throw new Error("Не удалось определить получателя");
      }

      await sendMessage({
        chatId: currentChat,
        senderId: currentUser.id,
        receiverId: chatData.interlocutor.id,
        text: text
      });

      messageInput.value = '';
    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert(error.message);
    }
  }

  if (sendButton && messageInput) {
    sendButton.addEventListener('click', handleSend);
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }
});