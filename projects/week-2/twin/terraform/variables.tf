variable "project_name" {
  type        = string
  description = "Name prefix for all resources"
  validation {
    condition     = can(regex("^[a-zA-Z0-9_-]+$", var.project_name)) && length(var.project_name) > 0
    error_message = "Project name must only contain alphanumeric characters, hyphens, or underscores and cannot be empty."
  }
}

variable "environment" {
    description = "Environment name (dev, test, prod)"
    type       = string
    validation {
        condition = contains(["dev", "test","prod"], var.environment)
        error_message = "Environment must be one of 'dev', 'test', or 'prod'."
    }
}

variable openai_api_key {
  type        = string
  default     = ""
  description = "openai api key"
}



variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 60
}

variable "api_throttle_burst_limit" {
  type        = number
  default     = 10
  description = "API Gateway throttle burst limit"
}

variable "api_throttle_rate_limit" {
  type        = number
  default     = 5
  description = "API Gateway throttle rate limit"
}

variable "use_custom_domain" {
  type        = bool
  default     = false
  description = "Attach a custom domain to CloudFront"
}

variable "root_domain" {
  type        = string
  default     = ""
  description = "Apex domain name, e.g mydomain.com"
}



