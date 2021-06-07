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

resource "aws_s3_bucket" "static_content" {
  bucket = var.static_content_bucket_name
  acl    = "private"

  policy = templatefile("roles/s3-cloudfront-policy.tmpl", {
    cloudfront_arn = aws_cloudfront_origin_access_identity.default.iam_arn,
    bucket_name    = var.static_content_bucket_name
  })

  website {
    index_document = "index.html"
    error_document = "index.html"
  }
}
