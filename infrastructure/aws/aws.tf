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

variable "database_password" {
  type = string
}

variable "admin_1_public_key" {
  type    = string
}

variable "https_certificate" {
  type    = string
  default = "arn:aws:acm:eu-west-1:313370994665:certificate/ff41ce0d-7743-481b-b0ce-166edf008faf"
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

resource aws_subnet db-private {
  cidr_block        = "10.0.32.0/20"
  vpc_id            = aws_vpc.vpc.id
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "${var.codename}-db-private"
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

resource "aws_security_group" "default-private-sg" {
  name        = "${var.codename}-private-sg"
  description = "Default private security group"
  vpc_id      = aws_vpc.vpc.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [
      "10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [
      "0.0.0.0/0"]
  }
}

resource "aws_security_group" "wordpress-sg" {
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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [
      "0.0.0.0/0"]
  }
}

# -------
# RDS Database
# -------

resource aws_db_instance database {
  allocated_storage       = 20
  max_allocated_storage   = 40
  storage_type            = "gp2"
  engine                  = "mysql"
  engine_version          = "8.0.20"
  instance_class          = "db.t2.micro"
  name                    = var.codename
  backup_retention_period = 5

  username = var.codename
  password = var.database_password

  vpc_security_group_ids = [
    aws_security_group.default-private-sg.id
  ]
  db_subnet_group_name   = aws_db_subnet_group.database.name
  publicly_accessible    = false
  availability_zone      = "${var.aws_region}a"
  skip_final_snapshot    = true
}

resource aws_db_subnet_group database {
  name       = "database-subnet-group"
  subnet_ids = [
    aws_subnet.private.id,
    aws_subnet.db-private.id
  ]
}

# ---------
# EC2 Instance
# ---------

resource aws_network_interface eth0 {
  subnet_id         = aws_subnet.public.id
  source_dest_check = false
  security_groups   = [
    aws_security_group.wordpress-sg.id
  ]
}

resource aws_network_interface eth1 {
  subnet_id         = aws_subnet.private.id
  source_dest_check = false
  security_groups   = [
    aws_security_group.wordpress-sg.id
  ]
}

resource aws_eip wordpress-ip {
  vpc               = true
  network_interface = aws_network_interface.eth0.id
}

resource aws_instance wordpress {

  ami           = "ami-0bb3fad3c0286ebd5"
  instance_type = "t2.micro"

  user_data_base64 = base64encode(templatefile("user_data/wordpress.tmpl", {
    admin_1_public_key = var.admin_1_public_key
  }))

  network_interface {
    device_index         = 0
    network_interface_id = aws_network_interface.eth0.id
  }

  network_interface {
    device_index         = 1
    network_interface_id = aws_network_interface.eth1.id
  }

  tags = {
    Name = "${var.codename}-wordpress"
  }
}

# -----------
# Elastic Load balancers
# -----------
resource "aws_lb" "nedluzimstatu-elb" {
  name               = "nedluzimstatu-elb"
  internal           = false
  load_balancer_type = "application"
  subnets            = [
    aws_subnet.public.id,
    aws_subnet.db-private.id
  ]
  security_groups    = [
    aws_security_group.wordpress-sg.id
  ]

  idle_timeout = 400

  tags = {
    Name = "nedluzimstatu-elb"
  }
}

resource "aws_lb_listener" "nedluzimstatu-listener" {
  load_balancer_arn = aws_lb.nedluzimstatu-elb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.https_certificate

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nedluzimstatu-tg.arn

  }
}

resource "aws_lb_listener" "nedluzimstatu-listener-http" {
  load_balancer_arn = aws_lb.nedluzimstatu-elb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nedluzimstatu-tg.arn

  }

  //  default_action {
  //    type = "redirect"
  //
  //    redirect {
  //      port        = "443"
  //      protocol    = "HTTPS"
  //      status_code = "HTTP_301"
  //    }
  //  }
}

resource "aws_lb_target_group" "nedluzimstatu-tg" {
  name        = "nedluzimstatu-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.vpc.id
  target_type = "ip"

  stickiness {
    enabled = false
    type    = "lb_cookie"
  }
}

resource "aws_lb_target_group_attachment" "nedluzimstatu-attachment" {
  target_group_arn = aws_lb_target_group.nedluzimstatu-tg.arn
  target_id        = aws_instance.wordpress.private_ip
  port             = 80
}

# -----------
# DNS
# -----------

resource aws_route53_zone private {
  name = "internal.nedluzimstatu.cz"

  vpc {
    vpc_id = aws_vpc.vpc.id
  }
}

# Temporary public zone before we can publish it under production domain
data "aws_route53_zone" "public-zone" {
  name         = "ceskodigital.net."
  private_zone = false
}

# DNS record for database
resource aws_route53_record database {
  zone_id = aws_route53_zone.private.zone_id
  name    = "database"
  type    = "CNAME"
  ttl     = "300"

  records = [
    aws_db_instance.database.address
  ]
}

resource aws_route53_record temporary-public {
  name    = "nedluzimstatu"
  type    = "A"
  zone_id = data.aws_route53_zone.public-zone.id

  alias {
    name                   = aws_lb.nedluzimstatu-elb.dns_name
    zone_id                = aws_lb.nedluzimstatu-elb.zone_id
    evaluate_target_health = true
  }
}
