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
  default = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC6W5QdfbR+2Lnfsp39i/jgjv1Ot7B71rPDZLajUHFMmo+j6YBVffm8K9gLS9omKlAl4LciA/Oy+LVesV5apeMRgYKsWIpPo6dh9BCCi+ip6vyvhUzvJjNBUMY6wIukBuAxpNEtF9DT/a1lCgDbAMnz9wVyqPDeoEPbWd9ufVJJg5+K96yRMKkjNio1Me+9o/ZbgGC85rCzdTq88wR1ilp7yhvCp5a+VpIdNlU2TlVZEq4R2CYu0xdKiaLy92ABo7Z3btetCRqruXfvhD7slkcDr88IqYCQptD2jhQu2F5Y++hU9CiOkeApaFrnGyKYtybRqI0/ISHYwFDFMN/IHvOzZV3NJpvmF3twIe7Y9437gW6Nqxkdr5EVDbICX9KdZKMIBU8ZmsFq26AP/cWAezo9xoNiqoWtnCeXwO1vCG2azdMuyAJ8GfiypWbYZoURVaKOmb44/yIUx3d8MlX/wqbGGrA4CpCFBwydLj5MNPVA19Y4M41hrxLQEaMudMJAvXE="
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
