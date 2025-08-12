# Cloudinary Setup Guide

This project now uses Cloudinary for image uploads instead of local file storage. Follow these steps to set up Cloudinary:

## 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. Verify your email address

## 2. Get Your Cloudinary Credentials

1. Log in to your Cloudinary dashboard
2. Go to the "Dashboard" section
3. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret

## 3. Add Environment Variables

Create a `.env.local` file in your project root and add the following variables:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

Replace the values with your actual Cloudinary credentials.

## 4. Features

The Cloudinary integration includes:

- **Automatic image optimization**: Images are automatically resized to 400x400px with face detection
- **Quality optimization**: Images are optimized for web delivery
- **Organized storage**: Images are stored in folders by user ID
- **Secure URLs**: All images are served via HTTPS
- **File validation**: Client-side validation for file size (max 5MB) and type

## 5. Usage

The profile update functionality now automatically uploads avatar images to Cloudinary when users update their profile. The uploaded image URL is stored in the database and served from Cloudinary's CDN.

## 6. Benefits

- **Better performance**: Images are served from Cloudinary's global CDN
- **Automatic optimization**: Images are optimized for different devices and screen sizes
- **Scalability**: No need to manage local file storage
- **Security**: Images are served over HTTPS with automatic optimization 