# API Documentation

## Overview
This document describes the API endpoints and usage.

## Base URL
```
https://api.example.com/v1
```

## Authentication
Include your API key in the request header:
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Get Resource
```
GET /resources/{id}
```

**Response:**
```json
{
    "id": "123",
    "name": "Example",
    "status": "active"
}
```

### Create Resource
```
POST /resources
```

**Request Body:**
```json
{
    "name": "New Resource",
    "status": "active"
}
```

## Error Handling
| Code | Message |
|------|---------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Server Error |

## Rate Limiting
- 1000 requests per hour per API key