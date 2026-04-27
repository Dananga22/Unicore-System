package com.unicore.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;
    private SecretKey signingKey;

    @PostConstruct
    void initialize() {
        if (jwtProperties.getSecret() == null || jwtProperties.getSecret().isBlank()) {
            throw new IllegalStateException("JWT secret must be configured via app.jwt.secret");
        }

        if (jwtProperties.getExpirationMs() <= 0) {
            throw new IllegalStateException("JWT expiration must be greater than zero");
        }

        // 🔥 FIX: Proper key generation for HS512
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    private Date calculateExpiryDate() {
        return Date.from(Instant.now().plusMillis(jwtProperties.getExpirationMs()));
    }

    public String generateToken(Authentication authentication) {
        String email;

        if (authentication.getPrincipal() instanceof UserPrincipal userPrincipal) {
            email = userPrincipal.getEmail();
        } else if (authentication.getPrincipal() instanceof OAuth2User oAuth2User) {
            email = oAuth2User.getAttribute("email");
        } else if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            email = userDetails.getUsername();
        } else if (authentication.getPrincipal() instanceof String str) {
            email = str;
        } else {
            email = authentication.getName();
        }

        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(calculateExpiryDate())
                .signWith(signingKey, Jwts.SIG.HS512) // ✅ stays HS512
                .compact();
    }

    public String generateTokenFromEmail(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(calculateExpiryDate())
                .signWith(signingKey, Jwts.SIG.HS512)
                .compact();
    }

    public String getUserEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(authToken);

            return true;

        } catch (ExpiredJwtException ex) {
            log.warn("JWT token expired: {}", ex.getMessage());

        } catch (UnsupportedJwtException | MalformedJwtException | SecurityException ex) {
            log.warn("Invalid JWT token: {}", ex.getMessage());

        } catch (IllegalArgumentException ex) {
            log.warn("JWT token is empty or invalid: {}", ex.getMessage());
        }

        return false;
    }
}