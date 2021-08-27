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

resource "aws_ecr_repository" "service-mail" {
  name                 = "service-mail"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# -------------
# IAM roles
# -------------

resource "aws_iam_role" "ecs-task-execution-role-transformation-service" {
  name = "ecs-task-execution-role-transformation-service"

  assume_role_policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Action    = "sts:AssumeRole",
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Effect    = "Allow",
        Sid       = ""
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs-task-execution-policy-attachment" {
  role       = aws_iam_role.ecs-task-execution-role-transformation-service.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "secrets-manager-policy-attachment" {
  role       = aws_iam_role.ecs-task-execution-role-transformation-service.name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
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
  execution_role_arn    = aws_iam_role.ecs-task-execution-role-transformation-service.arn
  task_role_arn         = aws_iam_role.ecs-task-execution-role-transformation-service.arn
  memory                = "512"
  cpu                   = "256"
}

resource "aws_ecs_task_definition" "service-mail" {
  family                = "service-mail"
  container_definitions = templatefile("service-mail.tmpl", {
    aws-region     = var.aws_region,
    aws-repository = aws_ecr_repository.service-mail.repository_url,
  })
  network_mode          = "awsvpc"
  execution_role_arn    = aws_iam_role.ecs-task-execution-role-transformation-service.arn
  task_role_arn         = aws_iam_role.ecs-task-execution-role-transformation-service.arn
  memory                = "512"
  cpu                   = "256"
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
    security_groups = [
      aws_security_group.transformation-service-sg.id]
    subnets         = [
      aws_subnet.private.id
    ]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.service-transformation-tg.arn
    container_name   = "service-transformation"
    container_port   = 8080
  }
}

resource "aws_ecs_service" "service-mail" {
  name                               = "service-mail"
  cluster                            = aws_ecs_cluster.service-transformation.id
  task_definition                    = aws_ecs_task_definition.service-mail.arn
  launch_type                        = "FARGATE"
  desired_count                      = 1
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 20

  network_configuration {
    security_groups = [
      aws_security_group.transformation-service-sg.id]
    subnets         = [
      aws_subnet.private.id
    ]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.service-mail-tg.arn
    container_name   = "service-mail"
    container_port   = 8081
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

  enable_deletion_protection = true

  subnets         = [
    aws_subnet.public.id,
    aws_subnet.public-c.id]
  security_groups = [
    aws_security_group.transformation-service-sg.id]
}

resource "aws_lb_listener" "service-transformation-elb-listener" {
  load_balancer_arn = aws_lb.service-transformation-lb.arn
  port              = "8080"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.service-transformation-tg.arn
  }
}

resource "aws_lb_listener" "service-mail-elb-listener" {
  load_balancer_arn = aws_lb.service-transformation-lb.arn
  port              = "8081"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.service-mail-tg.arn
  }
}

resource "aws_lb_target_group" "service-transformation-tg" {
  name        = "service-transformation-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.vpc.id
  target_type = "ip"
  health_check {
    enabled = true
    port    = 8080
    matcher = "200,404"
  }
}

resource "aws_lb_target_group" "service-mail-tg" {
  name        = "service-mail-tg"
  port        = 8081
  protocol    = "HTTP"
  vpc_id      = aws_vpc.vpc.id
  target_type = "ip"
  health_check {
    enabled = true
    port    = 8081
    matcher = "200,404"
  }
}
