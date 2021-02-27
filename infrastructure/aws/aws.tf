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
  default = "arn:aws:acm:us-east-1:313370994665:certificate/1eb30f1c-0b56-4bae-8530-ace418b8637a"
}

variable "static_content_bucket_name" {
  type = string
  default = "nedluzim-statu-static-deployment"
}

variable "public_domain" {
  type = string
  default  = "nedluzimstatu.cz"
}

locals {
  wordpress_ami = "ami-060e3b9873933dc14"
}

provider "aws" {
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

resource "aws_subnet" "private" {
  cidr_block        = "10.0.0.0/20"
  vpc_id            = aws_vpc.vpc.id
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "${var.codename}-private"
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

# ----------
# ECR (Docker repositories)
# ----------

resource "aws_ecr_repository" "service-transformation" {
  name                 = "service-transformation"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# --------
# service-transformation
# --------

resource "aws_ecs_cluster" "service-transformation" {
  name = "service-transformation"
}

resource "aws_ecs_task_definition" "service-transformation" {
  family                = "service-transformation"
  container_definitions = templatefile("service-transformation.tmpl", {
    aws-region     = var.aws_region,
    aws-repository = aws_ecr_repository.service-transformation.repository_url,
  })
  network_mode          = "awsvpc"
  #execution_role_arn    = aws_iam_role.ecs-task-execution-role.arn
  #task_role_arn         = aws_iam_role.ecs-task-execution-role.arn
  memory                = "1"
  cpu                   = "128"
}

resource "aws_ecs_service" "service-transformation" {
  name                               = "service-transformation"
  cluster                            = aws_ecs_cluster.service-transformation.id
  task_definition                    = aws_ecs_task_definition.service-transformation.arn
  launch_type                        = "FARGATE"
  desired_count                      = 1
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 20

  network_configuration {
    subnets          = [
      aws_subnet.private.id
    ]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.service-transformation-tg.arn
    container_name   = "service-transformation"
    container_port   = 8080
  }
}

resource "aws_cloudwatch_log_group" "service-transformation-lg" {
  name = "/ecs/service-transformation"
}

# --------------
# Load Balancers
# --------------

resource "aws_lb" "service-transformation-lb" {
  name               = "service-transformation-lb"
  internal           = false
  load_balancer_type = "application"
  subnets            = aws_subnet.public.*.id

  enable_deletion_protection = true
}

resource "aws_lb_listener" "service-transformation-elb-listener" {
  load_balancer_arn = aws_lb.service-transformation-lb.arn
  port              = "8080"
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.service-transformation-tg.arn
  }
}

resource "aws_lb_target_group" "service-transformation-tg" {
  name        = "service-transformation-tg"
  port        = 8080
  protocol    = "TCP"
  vpc_id      = aws_vpc.vpc.id
  target_type = "ip"
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

resource "aws_s3_bucket" "static_content" {
  bucket = var.static_content_bucket_name
  acl    = "private"

  policy = templatefile("roles/s3-cloudfront-policy.tmpl", {
    cloudfront_arn = aws_cloudfront_origin_access_identity.default.iam_arn,
    bucket_name = var.static_content_bucket_name
  })

  website {
    index_document = "index.html"
    error_document = "index.html"
  }
}

resource "aws_cloudfront_origin_access_identity" "default" {
  comment = "Cloudfront Origin Identity"
}

resource "aws_cloudfront_distribution" "distribution" {
  origin {
    domain_name = "${aws_s3_bucket.static_content.bucket}.${aws_s3_bucket.static_content.website_domain}"
    origin_id = "S3-Website-${aws_s3_bucket.static_content.bucket}.${aws_s3_bucket.static_content.website_domain}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = [
        "TLSv1",
        "TLSv1.1",
        "TLSv1.2"
      ]
    }
  }

  origin {
    domain_name = aws_s3_bucket.static_content.bucket_regional_domain_name
    origin_id = "S3-${aws_s3_bucket.static_content.id}"
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.default.cloudfront_access_identity_path
    }
  }

  enabled = true
  is_ipv6_enabled = true
  default_root_object = "index.html"

  aliases = [
    var.public_domain,
    "www.${var.public_domain}"
  ]

  default_cache_behavior {
    allowed_methods = [
      "GET",
      "HEAD"]
    cached_methods = [
      "GET",
      "HEAD"]
    target_origin_id = "S3-Website-${aws_s3_bucket.static_content.bucket}.${aws_s3_bucket.static_content.website_domain}"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
    min_ttl = 0
    default_ttl = 86400
    max_ttl = 86400
    compress = true
    viewer_protocol_policy = "redirect-to-https"
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = var.https_certificate
    cloudfront_default_certificate = false
    ssl_support_method = "sni-only"
    minimum_protocol_version = "TLSv1.2_2018"
  }
}
