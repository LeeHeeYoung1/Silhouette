package com.app.silhouette.chatting;

import java.util.Date;

public class ChatAttachmentDTO {
    private Long chat_attachment_seq;
    private Long chat_message_seq;
    private String original_name;
    private String stored_name;
    private String file_url;
    private String file_type;
    private Long file_size;
    private Long duration;
    private Date created_at;

    public Long getChat_attachment_seq() { return chat_attachment_seq; }
    public void setChat_attachment_seq(Long chat_attachment_seq) { this.chat_attachment_seq = chat_attachment_seq; }

    public Long getChat_message_seq() { return chat_message_seq; }
    public void setChat_message_seq(Long chat_message_seq) { this.chat_message_seq = chat_message_seq; }

    public String getOriginal_name() { return original_name; }
    public void setOriginal_name(String original_name) { this.original_name = original_name; }

    public String getStored_name() { return stored_name; }
    public void setStored_name(String stored_name) { this.stored_name = stored_name; }

    public String getFile_url() { return file_url; }
    public void setFile_url(String file_url) { this.file_url = file_url; }

    public String getFile_type() { return file_type; }
    public void setFile_type(String file_type) { this.file_type = file_type; }

    public Long getFile_size() { return file_size; }
    public void setFile_size(Long file_size) { this.file_size = file_size; }

    public Long getDuration() { return duration; }
    public void setDuration(Long duration) { this.duration = duration; }

    public Date getCreated_at() { return created_at; }
    public void setCreated_at(Date created_at) { this.created_at = created_at; }
}