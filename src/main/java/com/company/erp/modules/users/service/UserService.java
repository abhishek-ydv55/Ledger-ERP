package com.company.erp.modules.users.service;

import com.company.erp.modules.users.dto.UserRequest;
import com.company.erp.modules.users.dto.UserResponse;

import java.util.List;
import java.util.UUID;

public interface UserService {

    UserResponse createUser(UserRequest request);

    UserResponse getUserById(UUID id);

    List<UserResponse> getAllUsers();

    UserResponse updateUser(UUID id, UserRequest request);

    void deleteUser(UUID id);
}
