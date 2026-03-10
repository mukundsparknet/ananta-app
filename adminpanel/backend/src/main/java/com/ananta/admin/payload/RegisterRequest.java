package com.ananta.admin.payload;

import lombok.Data;

@Data
public class RegisterRequest {
    private String userId;
    private String username;
    private String email;
    private String phone;
    private String fullName;
    private String gender;
    private String birthday;
    private String bio;
    private String addressLine1;
    private String city;
    private String state;
    private String country;
    private String pinCode;
    private String location;
    private String documentType;
    private String documentNumber;
    private String profileImage;
    private String documentFrontImage;
    private String documentBackImage;
}
