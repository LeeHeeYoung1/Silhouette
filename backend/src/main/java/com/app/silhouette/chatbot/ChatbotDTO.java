package com.app.silhouette.chatbot;

public class ChatbotDTO {

    private Long chatbot_seq;
    private String question;
    private String answer;
    private String category;
    private String activity;
    private String region;
    private String food;

    public Long getChatbotSeq() { return chatbot_seq; }
    public void setChatbotSeq(Long chatbot_seq) { this.chatbot_seq = chatbot_seq; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getActivity() { return activity; }
    public void setActivity(String activity) { this.activity = activity; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getFood() { return food; }
    public void setFood(String food) { this.food = food; }
}
