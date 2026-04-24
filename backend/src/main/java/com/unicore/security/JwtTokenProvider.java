package com.unicore.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    // Using a hardcoded secret for local dev, should use env variables in prod
    private final String jwtSecret = "DUMMY_SECRET_FOR_LOCAL_DEV_PLEASE_CHANGE_IN_PROD_9876543210ABCDEF";
    private final int jwtExpirationMs = 86400000; // 1 day

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(Authentication authentication) {
        String email = null;

        if (authentication.getPrincipal() instanceof UserPrincipal) {
            email = ((UserPrincipal) authentication.getPrincipal()).getEmail();
        } else if (authentication.getPrincipal() instanceof OAuth2User) {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            email = oAuth2User.getAttribute("email");
        } else if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
            email = ((org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal()).getUsername();
        } else if (authentication.getPrincipal() instanceof String) {
            email = (String) authentication.getPrincipal();
        } else {
            email = authentication.getName();
        }

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .claim("sub", email)
                .issuedAt(new Date())
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }
    
    public String generateTokenFromEmail(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .claim("sub", email)
                .issuedAt(new Date())
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String getUserEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parser().verifyWith((javax.crypto.SecretKey) getSigningKey()).build().parseSignedClaims(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            System.err.println("Invalid JWT Token: " + ex.getMessage());
        }
        return false;
    }
}
