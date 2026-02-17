package database

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// DB represents the database instance
var DB *gorm.DB

// User represents a user model
type User struct {
	ID    uint   `json:"id" gorm:"primary_key"`
	Name  string `json:"name"`
	Email string `json:"email" gorm:"unique"`
}

// Initialize initializes the database and automigrates the User model
func Initialize() {
	var err error
	DB, err = gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect to the database")
	}
	DB.AutoMigrate(&User{})
}