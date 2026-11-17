package com.app.silhouette.post;

import org.springframework.stereotype.Service;

@Service
public class PostService {

	private final PostDAO postDao;
	public PostService (PostDAO postDao) {
		this.postDao= postDao;
	}
	public Long insertPost(PostDTO dto) {
		postDao.insertPost(dto);
		return dto.getPostSeq();
	}
}
