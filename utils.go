package utils

import (
    "time"
    "github.com/dgrijalva/jwt-go"
)

// GenerateToken generates a JWT token for a user
func GenerateToken(userID string, secretKey string, expirationTime time.Duration) (string, error) {
    tokenClaims := jwt.MapClaims{}
    tokenClaims["user_id"] = userID
    tokenClaims["exp"] = time.Now().Add(expirationTime).Unix()

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, tokenClaims)
    return token.SignedString([]byte(secretKey))
}

// ParseToken parses and validates the token
func ParseToken(tokenStr string, secretKey string) (*jwt.Token, error) {
    token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
        return []byte(secretKey), nil
    })

    return token, err
}

// GetCurrentTime returns the current UTC time formatted as YYYY-MM-DD HH:MM:SS
func GetCurrentTime() string {
    return time.Now().UTC().Format("2006-01-02 15:04:05")
}