variable "aws_region" {
  type    = string
  default = "eu-west-1"
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
  default = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDEeeH3pe0IKz2OE4jVxYKycwhz4Vywkcima+vk0XF/oqMSc+uR5Dqw7/y3/4yysch3+/adeIfY6Vb11akZvCcS22/1O9EtpHupB2noRLgcOCBhRwBR+EGgUrhcMWEzJ8yNaqpC2Z8GvhJcO7F3rlktISVh/GOXI/91KcapU3v9I+ASELbCaQm9mdNQBvf2vyRzWhRW18bgi43r9RmwPNI3B/xJIkYFFa7OnUBGTvi1PW9X8ZQkDGwTT0b4fAKP4tl6UaXOkF3vpIT1gmyL4jiZccDKFJkKdTxtyt67lON22MWKmjrCs8nASX4syyefAbA3tHREYdPeZJTtx95r3Puv"
}

variable "static_content_bucket_name" {
  type    = string
  default = "nedluzim-statu-static-deployment"
}

variable "https_certificate" {
  type    = string
  default = "arn:aws:acm:us-east-1:313370994665:certificate/1eb30f1c-0b56-4bae-8530-ace418b8637a"
}

locals {
  wordpress_ami = "ami-060e3b9873933dc14"
}