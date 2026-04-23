package com.unicore.security;

import com.unicore.model.User;
import com.unicore.model.User.Role;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        try {
            return processOAuth2User(userRequest, oAuth2User);
        } catch (Exception ex) {
            throw new OAuth2AuthenticationException(ex.getMessage());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        if (email == null || email.isEmpty()) {
            throw new RuntimeException("Email not found from OAuth2 provider");
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            // Update profile info for existing user
            user.setName(oAuth2User.getAttribute("name"));
            String picture = oAuth2User.getAttribute("picture");
            if (picture != null) user.setPicture(picture);
            
            // If the user previously used email/pass, we link the account
            if (user.getProvider() == null) {
                user.setProvider(userRequest.getClientRegistration().getRegistrationId());
                user.setProviderId(oAuth2User.getAttribute("sub"));
            }
            user = userRepository.save(user);
        } else {
            // Register new user
            user = User.builder()
                    .name(oAuth2User.getAttribute("name"))
                    .email(email)
                    .picture(oAuth2User.getAttribute("picture"))
                    .provider(userRequest.getClientRegistration().getRegistrationId())
                    .providerId(oAuth2User.getAttribute("sub"))
                    .role(Role.USER)
                    .status(User.UserStatus.ACTIVE)
                    .build();
            user = userRepository.save(user);
        }

        return UserPrincipal.create(user, oAuth2User.getAttributes());
    }
}
