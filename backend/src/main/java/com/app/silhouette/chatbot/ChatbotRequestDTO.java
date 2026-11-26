package com.app.silhouette.chatbot;

public class ChatbotRequestDTO {

    private String question;
    private String conversation;

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getConversation() { return conversation; }
    public void setConversation(String conversation) { this.conversation = conversation; }
}