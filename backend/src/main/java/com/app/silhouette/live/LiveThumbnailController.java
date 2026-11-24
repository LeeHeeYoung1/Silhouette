package com.app.silhouette.live;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;

// 방송 썸네일 업로드 → GCS live/thumbnail/ 폴더
// 받은 URL을 방송 시작·수정 API의 thumbnailUrl로 보낸다
@RestController
@RequestMapping("/api/upload")
public class LiveThumbnailController {

    private static final long MAX_SIZE = 5L * 1024 * 1024;

    private final Storage storage;
    private final LiveDAO dao;

    @Value("${gcp.bucket}")
    private String bucket;

    public LiveThumbnailController(Storage storage, LiveDAO dao) {
        this.storage = storage;
        this.dao = dao;
    }

    // multipart/form-data, 필드명 file → { thumbnailUrl }
    @PostMapping("/thumbnail")
    public ResponseEntity<Map<String, String>> upload(@RequestAttribute("id") String loginId,
            @RequestParam("file") MultipartFile file) throws IOException {
        if (dao.selectMemberSeqByLoginId(loginId) == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "회원 정보를 찾을 수 없어요.");
        }
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미지를 선택해주세요.");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "썸네일은 5MB까지 가능해요.");
        }

        byte[] bytes = file.getBytes();
        String[] type = detectImageType(bytes);   // 확장자/Content-Type이 아니라 실제 내용으로 판단
        if (type == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "jpg, png, webp 이미지만 가능해요.");
        }

        String objectName = "live/thumbnail/" + UUID.randomUUID() + "." + type[0];
        BlobInfo info = BlobInfo.newBuilder(bucket, objectName).setContentType(type[1]).build();
        storage.create(info, bytes);

        String url = "https://storage.googleapis.com/" + bucket + "/" + objectName;
        return ResponseEntity.ok(Map.of("thumbnailUrl", url));
    }

    // 파일 앞부분(매직 넘버)으로 이미지 형식 판별 → { 확장자, Content-Type } / 아니면 null
    private static String[] detectImageType(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return new String[] { "jpg", "image/jpeg" };
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') {
            return new String[] { "png", "image/png" };
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return new String[] { "webp", "image/webp" };
        }
        return null;
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<String> handleError(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
    }
}
