resource "aws_cloudfront_origin_access_identity" "default" {
  comment = "Cloudfront Origin Identity"
}

resource "aws_cloudfront_distribution" "distribution" {
  origin {
    domain_name = "${aws_s3_bucket.static_content.bucket}.${aws_s3_bucket.static_content.website_domain}"
    origin_id   = "S3-Website-${aws_s3_bucket.static_content.bucket}.${aws_s3_bucket.static_content.website_domain}"

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
    origin_id   = "S3-${aws_s3_bucket.static_content.id}"
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.default.cloudfront_access_identity_path
    }
  }

  origin {
    domain_name = aws_lb.service-transformation-lb.dns_name
    origin_id   = "service-transformation"

    custom_origin_config {
      http_port              = 8080
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
    domain_name = aws_lb.service-transformation-lb.dns_name
    origin_id   = "service-mail"

    custom_origin_config {
      http_port              = 8081
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = [
        "TLSv1",
        "TLSv1.1",
        "TLSv1.2"
      ]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  aliases = [
    var.public_domain,
    "www.${var.public_domain}",
    "iprp.${var.public_domain}"
  ]

  default_cache_behavior {
    allowed_methods  = [
      "GET",
      "HEAD"]
    cached_methods   = [
      "GET",
      "HEAD"]
    target_origin_id = "S3-Website-${aws_s3_bucket.static_content.bucket}.${aws_s3_bucket.static_content.website_domain}"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  ordered_cache_behavior {
    path_pattern     = "/dluhove-poradny?"
    allowed_methods  = [
      "GET",
      "HEAD"]
    cached_methods   = [
      "GET",
      "HEAD"]
    target_origin_id = "S3-Website-${aws_s3_bucket.static_content.bucket}.${aws_s3_bucket.static_content.website_domain}"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    lambda_function_association {
      event_type = "viewer-request"
      lambda_arn = aws_lambda_function.lambda_edge_request.qualified_arn
    }
  }

  ordered_cache_behavior {
    path_pattern     = "/transformation-service/*"
    allowed_methods  = [
      "GET",
      "POST",
      "DELETE",
      "OPTIONS",
      "PUT",
      "PATCH",
      "HEAD"]
    cached_methods   = [
      "GET",
      "HEAD"]
    target_origin_id = "service-transformation"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    lambda_function_association {
      event_type = "origin-request"
      lambda_arn = aws_lambda_function.lambda_edge_request.qualified_arn
    }

    lambda_function_association {
      event_type = "viewer-response"
      lambda_arn = aws_lambda_function.lambda_edge_response.qualified_arn
    }
  }

  ordered_cache_behavior {
    path_pattern     = "/mail-service/*"
    allowed_methods  = [
      "GET",
      "POST",
      "DELETE",
      "OPTIONS",
      "PUT",
      "PATCH",
      "HEAD"]
    cached_methods   = [
      "GET",
      "HEAD"]
    target_origin_id = "service-mail"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    lambda_function_association {
      event_type = "origin-request"
      lambda_arn = aws_lambda_function.lambda_edge_request.qualified_arn
    }

    lambda_function_association {
      event_type = "viewer-response"
      lambda_arn = aws_lambda_function.lambda_edge_response.qualified_arn
    }
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = var.https_certificate
    cloudfront_default_certificate = false
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2018"
  }
}

resource "aws_lambda_function" "lambda_edge_request" {
  provider      = aws.lambda
  publish       = true
  filename      = "transformation_service_reverse_proxy.zip"
  function_name = "transformation-service-reverse-proxy-request"
  role          = aws_iam_role.lambda_edge_exec.arn
  handler       = "index.request_handler"
  runtime       = "nodejs12.x"

}

resource "aws_lambda_function" "lambda_edge_response" {
  provider      = aws.lambda
  publish       = true
  filename      = "transformation_service_reverse_proxy.zip"
  function_name = "transformation-service-reverse-proxy-response"
  role          = aws_iam_role.lambda_edge_exec.arn
  handler       = "index.response_handler"
  runtime       = "nodejs12.x"

}

resource "aws_iam_role" "lambda_edge_exec" {
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": ["lambda.amazonaws.com", "edgelambda.amazonaws.com"]
      },
      "Effect": "Allow"
    }
  ]
}
EOF
}
