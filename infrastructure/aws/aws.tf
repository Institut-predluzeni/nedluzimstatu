terraform {
  required_version = ">= 0.12.25"

  required_providers {
    aws = ">= 2.61.0"
  }

  backend "s3" {
    bucket = "production-nedluzim-statu-terraform-backend-eu-west-1"
    key    = "terraform.tfstate"
    region = "eu-west-1"
  }
}

variable "aws_region" {
  type    = string
  default = "eu-west-1"
}

variable "codename" {
  type    = string
  default = "nedluzimstatu"
}

variable "admin_1_public_key" {
  type    = string
  default = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDEeeH3pe0IKz2OE4jVxYKycwhz4Vywkcima+vk0XF/oqMSc+uR5Dqw7/y3/4yysch3+/adeIfY6Vb11akZvCcS22/1O9EtpHupB2noRLgcOCBhRwBR+EGgUrhcMWEzJ8yNaqpC2Z8GvhJcO7F3rlktISVh/GOXI/91KcapU3v9I+ASELbCaQm9mdNQBvf2vyRzWhRW18bgi43r9RmwPNI3B/xJIkYFFa7OnUBGTvi1PW9X8ZQkDGwTT0b4fAKP4tl6UaXOkF3vpIT1gmyL4jiZccDKFJkKdTxtyt67lON22MWKmjrCs8nASX4syyefAbA3tHREYdPeZJTtx95r3Puv"
}

variable "https_certificate" {
  type    = string
  default = "arn:aws:acm:eu-west-1:313370994665:certificate/ff41ce0d-7743-481b-b0ce-166edf008faf"
}

locals {
  wordpress_ami = "ami-060e3b9873933dc14"
}

provider "aws" {
  version = "~> 2.0"
  region  = var.aws_region
}

# ----------------
# VPC Section
# ----------------

resource "aws_vpc" "vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = var.codename
  }
}

resource "aws_subnet" "public" {
  cidr_block        = "10.0.16.0/20"
  vpc_id            = aws_vpc.vpc.id
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "${var.codename}-public"
  }
}

resource "aws_internet_gateway" "internet-gateway" {
  vpc_id = aws_vpc.vpc.id
  tags   = {
    Name = "${var.codename}-internet-gateway"
  }
}

resource "aws_route_table" "public-routes" {
  vpc_id = aws_vpc.vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.internet-gateway.id
  }

  tags = {
    Name = "${var.codename}-public-routes"
  }
}

resource "aws_route_table_association" "public-subnet" {
  route_table_id = aws_route_table.public-routes.id
  subnet_id      = aws_subnet.public.id
}

# -----------
# Security Groups
# -----------

resource "aws_security_group" "development-sg" {
  name        = "${var.codename}-wordpress-sg"
  description = "Security group for Wordpress"
  vpc_id      = aws_vpc.vpc.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [
      "10.0.0.0/16"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [
      "0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [
      "0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [
      "0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [
      "0.0.0.0/0"]
  }
}

resource aws_eip wordpress-ip {
  vpc      = true
  instance = aws_instance.wordpress.id
}

resource aws_instance wordpress {

  ami           = local.wordpress_ami
  instance_type = "t2.micro"

  user_data_base64 = base64encode(templatefile("user_data/wordpress.tmpl", {
    admin_1_public_key = var.admin_1_public_key
  }))

  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [
    aws_security_group.development-sg.id
  ]

  tags = {
    Name = "${var.codename}-wordpress"
  }
}

data "aws_route53_zone" "public-zone" {
  name         = "ceskodigital.net."
  private_zone = false
}

resource aws_route53_record temporary-public {
  depends_on = [
    aws_instance.wordpress,
    aws_eip.wordpress-ip
  ]
  name       = "nedluzimstatu"
  type       = "A"
  zone_id    = data.aws_route53_zone.public-zone.id
  ttl        = "300"

  records = [
    aws_instance.wordpress.public_ip
  ]
}

resource "aws_s3_bucket" "bucket" {
  bucket = "nedluzim-statu-static-deployment"
  acl    = "private"

  cors_rule {
    allowed_headers = [
      "Authorization"]
    allowed_methods = [
      "GET",
      "HEAD"]
    allowed_origins = [
      "*"]
    expose_headers  = []
    max_age_seconds = 3000
  }
}
