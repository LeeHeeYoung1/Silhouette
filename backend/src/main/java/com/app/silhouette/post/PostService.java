package com.app.silhouette.post;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;

@Service
public class PostService {

	private static final int MAX_FILES = 6;

	private final PostDAO postDAO;
	private final Storage storage;     // GCSConfig에서 만든 Bean

	@Value("${gcp.bucket}")
	private String bucket;

	public PostService(PostDAO postDAO, Storage storage) {
		this.postDAO = postDAO;
		this.storage = storage;
	}

	// 게시글 등록 + 첨부파일 저장
	// 회원이 없으면 null 반환
	@Transactional
	public Long insertPost(PostDTO dto, List<MultipartFile> files) throws Exception {
		// ① 회원 확인
		Long memberSeq = postDAO.selectMemberSeqByLoginId(dto.getLoginId());
		if (memberSeq == null) {
			return null;
		}
		dto.setMemberSeq(memberSeq);

		// ② 게시글 저장 → dto.postSeq에 새 글 번호
		postDAO.insertPost(dto);

		// ③ 첨부파일 저장
		if (files != null) {
			if (files.size() > MAX_FILES) {
				throw new IllegalArgumentException("첨부파일은 최대 " + MAX_FILES + "개입니다.");
			}
			int order = 1;
			for (MultipartFile file : files) {
				if (file.isEmpty()) continue;
				postDAO.insertPostFile(uploadToGcs(file, dto.getPostSeq(), order++));
			}
		}
		return dto.getPostSeq();
	}

	// GCS 버킷에 업로드하고 POST_FILE 정보를 만들어 돌려줌
	private PostFileDTO uploadToGcs(MultipartFile file, Long postSeq, int order) throws Exception {
		String originalName = file.getOriginalFilename();
		String storedName = "post/" + postSeq + "/" + UUID.randomUUID() + "_" + originalName;

		BlobInfo blobInfo = BlobInfo.newBuilder(bucket, storedName)
				.setContentType(file.getContentType())
				.build();
		storage.create(blobInfo, file.getBytes());

		PostFileDTO fileDto = new PostFileDTO();
		fileDto.setPostSeq(postSeq);
		fileDto.setOriginalName(originalName);
		fileDto.setStoredName(storedName);
		fileDto.setFilePath("https://storage.googleapis.com/" + bucket + "/" + storedName);
		fileDto.setFileSize(file.getSize());
		fileDto.setFileType(file.getContentType() != null && file.getContentType().startsWith("image/") ? "IMAGE" : "FILE");
		fileDto.setSortOrder(order);
		return fileDto;
	}
	
	public List<PostDTO> selectAll(String category){
		return postDAO.selectALl(category);
	}
	
	@Transactional
	public PostDTO selectPost(Long postSeq) {
		postDAO.updateViewCount(postSeq);
		return postDAO.selectPost(postSeq);
	}
	public List<PostFileDTO> selectPostFiles(Long postSeq){
		return postDAO.selectPostFiles(postSeq);
		
	}
	public PostFileDTO selectPostDownload(Long postFileSeq, String loginId) {
		checkMember(loginId);
		PostFileDTO file= postDAO.PostDownLoad(postFileSeq);
		if(file == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다.");
		}
		return file;
	}

	// GCS에서 파일 내용 꺼내기
	public byte[] downloadFile(PostFileDTO file) {
	    String objectName =  file.getStoredName();
	    Blob blob = storage.get(BlobId.of(bucket, objectName));
	    if (blob == null) {
	        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "저장소에 파일이 없습니다.");
	    }
	    return blob.getContent();
	}

	// 회원 확인 (JWT 완성 전 임시: loginId로 확인)
	private void checkMember(String loginId) {
	    if (loginId == null || loginId.isBlank()
	            || postDAO.selectMemberSeqByLoginId(loginId) == null) {
	        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인한 회원만 다운로드할 수 있습니다.");
	    }
	}
}