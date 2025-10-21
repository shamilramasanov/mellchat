package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/sirupsen/logrus"
)

const (
	YOUTUBE_API_KEY = "AIzaSyBNFqUmAVyODPat0w0HOa6W6POq0N6cook"
)

type YouTubeCollector struct {
	apiKey    string
	redis     *redis.Client
	logger    *logrus.Logger
	ctx       context.Context
}

type Message struct {
	ID        string    `json:"id"`
	Platform  string    `json:"platform"`
	Channel   string    `json:"channel"`
	Username  string    `json:"username"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	Category  string    `json:"category"`
	Upvotes   int       `json:"upvotes"`
}

func NewYouTubeCollector() *YouTubeCollector {
	// Redis connection
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	// Logger setup
	logger := logrus.New()
	logger.SetLevel(logrus.InfoLevel)
	logger.SetFormatter(&logrus.JSONFormatter{})

	return &YouTubeCollector{
		apiKey: YOUTUBE_API_KEY,
		redis:  rdb,
		logger: logger,
		ctx:    context.Background(),
	}
}

func (yc *YouTubeCollector) Start() {
	yc.logger.Info("Starting YouTube Collector", map[string]interface{}{
		"api_key": yc.apiKey[:10] + "...",
	})

	// Test Redis connection
	_, err := yc.redis.Ping(yc.ctx).Result()
	if err != nil {
		yc.logger.Fatal("Failed to connect to Redis", map[string]interface{}{
			"error": err.Error(),
		})
	}

	yc.logger.Info("Connected to Redis successfully")

	// Start collecting messages
	yc.collectMessages()
}

func (yc *YouTubeCollector) collectMessages() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			yc.processMessages()
		case <-yc.ctx.Done():
			yc.logger.Info("YouTube Collector stopped")
			return
		}
	}
}

func (yc *YouTubeCollector) processMessages() {
	// Simulate message collection
	message := Message{
		ID:        fmt.Sprintf("yt_%d", time.Now().Unix()),
		Platform:  "youtube",
		Channel:   "test_channel",
		Username:  "test_user",
		Message:   "Test message from YouTube",
		Timestamp: time.Now(),
		Category:  "general",
		Upvotes:   0,
	}

	// Publish to Redis
	err := yc.redis.Publish(yc.ctx, "messages:youtube", message).Err()
	if err != nil {
		yc.logger.Error("Failed to publish message", map[string]interface{}{
			"error": err.Error(),
		})
		return
	}

	yc.logger.Info("Message published", map[string]interface{}{
		"platform": message.Platform,
		"channel":  message.Channel,
		"username": message.Username,
	})
}

func main() {
	collector := NewYouTubeCollector()
	collector.Start()
}
