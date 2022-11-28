variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

variable "codename" {
  type    = string
  default = "nedluzimstatu"
}

variable "public_domain" {
  type    = string
  default = "nedluzimstatu.cz"
}

variable "admin_1_public_key" {
  type    = string
  default = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDrcg+4Lk0qMiKfohLwJzjCYedgX4W0t+xM1DBOsmQJDmSRZTWY0tdurfDUnr0gDtgTWlk6qUOALEEvwL0h8pAcJjKXUoc+hiHF5UY4VvQr1U0A9hPq9GO+BvRZgbaIYTmT9TXio69DYsz3pevb/PZsCW21vorHLLttg9KXu73yAM1hV39++YQFPG2XME/S7fLl7IXnT8+cIvXwcW/chQSOc3eqpngNw4gJfwc5jHj4ZweQnMhSAKYHjWDRy0wvSYCo1zeUbdSffctWG0XpQNJuWV1gPrxZpBMjB5l8bCRNoUErdq21zWlMRhP9E5XNLe6X6IVUIBZXa7sfN1LdbXK7rHZ/P8MSQIHdXkhsuIUJy6vede1rt3a+ir+k2JtZXHIjo/JIk1k8hwgd/GIoi4f78wwerwSBJjYaM/SZnhdt00voNpwg/x2L2FlStbeSrTqk7UaPbQf/S98q4Picz/P5MGixH/wSawDl0c0VsGwUnIcjHpeCZduep4xzlJB6gOU="
}

variable "static_content_bucket_name" {
  type    = string
  default = "nedluzim-statu-static-deployment-iprp"
}

variable "https_certificate" {
  type    = string
  default = "arn:aws:acm:us-east-1:734731567119:certificate/79422c20-6f85-41ed-ad52-e0da62d4a57f"
}

locals {
  wordpress_ami = "ami-0528c306035ada44a"
}
