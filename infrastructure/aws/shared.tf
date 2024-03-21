terraform {
  required_version = "= 0.14.7"

  required_providers {
    aws = ">= 3.28.0"
  }

  backend "s3" {
    bucket = "production-nedluzim-statu-terraform-backend-eu-central-1"
    key    = "terraform.tfstate"
    region = "eu-central-1"
  }
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  region = "us-east-1"
  alias  = "lambda"
}

# ----------------
# NAT Gateway Section
# ----------------
data "aws_ami" "nat-gateway" {
  owners      = [
    "amazon"]
  most_recent = true
  filter {
    name   = "name"
    values = [
      "amzn-ami-vpc-nat-*-x86_64-ebs"]
  }
}

resource "aws_eip_association" "nat-gateway" {
  instance_id   = aws_instance.nat-gateway.id
  allocation_id = aws_eip.nat.id
}

resource "aws_instance" "nat-gateway" {
  ami                     = data.aws_ami.nat-gateway.id
  instance_type           = "t2.micro"
  subnet_id               = aws_subnet.public.id
  source_dest_check       = false
  disable_api_termination = false
  availability_zone       = "${var.aws_region}a"
  vpc_security_group_ids  = [
    aws_security_group.development-sg.id]

  tags = {
    Name = "NAT"
  }
}

resource "aws_eip" "nat" {
  vpc = true
}

resource "aws_route_table" "private-routes" {
  vpc_id = aws_vpc.vpc.id

  route {
    cidr_block  = "0.0.0.0/0"
    instance_id = aws_instance.nat-gateway.id
  }
}

resource "aws_route_table_association" "private-subnet" {
  route_table_id = aws_route_table.private-routes.id
  subnet_id      = aws_subnet.private.id
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

resource "aws_subnet" "public-c" {
  cidr_block        = "10.0.32.0/20"
  vpc_id            = aws_vpc.vpc.id
  availability_zone = "${var.aws_region}c"

  tags = {
    Name = "${var.codename}-public-c"
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

resource "aws_route_table_association" "public-subnet-c" {
  route_table_id = aws_route_table.public-routes.id
  subnet_id      = aws_subnet.public-c.id
}

# -----------
# Security Groups
# -----------
resource "aws_security_group" "private-default-sg" {
  name        = "${var.codename}-private-default-sg"
  description = "Default SG for private network."
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

resource "aws_iam_user" "github_deployment" {
  name = "github_deployment"
}

resource "aws_iam_access_key" "github_deployment" {
  user = aws_iam_user.github_deployment.name
}

resource "aws_iam_user_policy_attachment" "github_deployment_static_deploy" {
  user       = aws_iam_user.github_deployment.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}
