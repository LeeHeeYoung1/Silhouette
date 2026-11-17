package com.app.silhouette.utils;

import java.security.MessageDigest;

public class SHA512 {

    public static String encrypt(String pw) throws Exception {

        MessageDigest md = MessageDigest.getInstance("SHA-512");
        md.update(pw.getBytes());

        byte[] bytes = md.digest();

        StringBuilder sb = new StringBuilder();

        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }

        return sb.toString();
    }
}