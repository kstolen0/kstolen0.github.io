---
layout: post
title: "Getting Started with AWS and Terraform: 02 - Hosting a dockerized web service in our EC2 container"
date: 2024-08-21 16:00:00 +0800
categories: aws Terraform infratructure IaC ECR Docker
description: In this multi-part blog series we will learn how to create a modern enterprise ready web service in AWS using Terraform. In this post, we will deploy a Dockerized web service to ECR for our EC2 instance to host
---

Hello again! Welcome back to our multi-part blog series on getting started with AWS and Terraform.  

In part two of this series, we'll take our humble EC2 instance, deploy a web server image to it, and make it reachable from anywhere across the internet.

At the end of this post you should be able to:

1. Configure an Elastic Container Repository (ECR)
2. Deploy a Docker Image to ECR
3. Pull and run Docker Images from ECR onto an EC2 instance

## Prerequisites

1. Completed the steps from [part 1](/_posts/2024-08-07-get-started-with-aws-tf-01.md)
    * The steps in this post follow directly from where we left off in the last post
2. Installed [awscli](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html)
    * We'll be using the awscli locally to provide credentials to Docker to interact with AWS ECR
2. Installed [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or at least the [Docker Engine](https://docs.docker.com/engine/install/))
    * We'll be using [Docker](https://www.docker.com/) to build a simple node application into a Docker image and push the image to AWS ECR

## Step 1 - Create an ECR Repository

In this step we'll define our [ECR](https://aws.amazon.com/ecr/) repository which will store our web server container images.

AWS ECR is a service for hosting container image repositories which can be used by services on the internet to pull and run container images.

As we may be applying and destroying our environment multiple times, it might be simpler to create this repository in another Terraform project. 

Create a new directory alongside `infra` called `ecr`.  

Add a `main.tf` and `aws-provider.tf` as shown in [this gist](https://gist.github.com/kstolen0/e02a97e7c684c04743634999bb68b734), replacing the aws provider keys and region with your own then run `terraform init`.

Create a new file called `ecr.tf` within the `ecr` directory and add the following:

```terraform
# /ecr/ecr.tf

resource "aws_ecr_repository" "unicorn_api_ecr" {
  name                 = "unicorn-api"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

output "unicorn_api_ecr_uri" {
  description = "The uri of the unicorn api ecr repository"
  value       = aws_ecr_repository.unicorn_api_ecr.repository_url
}
```

Above we have defined a new [aws_ecr_repository](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ecr_repository) resource and an output value of the repo uri which will be used to push and pull our container image.

The `image_tag_mutability` property controls whether tags can be reused.  

When set to `MUTABLE`, tags can be reused, allowing clients to pull the latest image automatically (e.g. via the `latest` tag).  

When set to `IMMUTABLE` tags are fixed to specific images which prevents automatic updates but provides clients with greater stability and control as the image wont change unless the tag itself is updated.

The `scan_on_push` property controls whether images should be scanned for vulnerabilities upon being pushed to the repository. As it's free to enable, we might as well do so in case it finds any [CVEs](https://cve.mitre.org/).

The `name` property should be self-evident.

Let's run `terraform apply` to create this repository, and make note of the repository uri output.

## Step 2 - Building our web server image and pushing it to ECR

Now that we've defined an ECR repo, we need a container image to host within the repo. This image could be whatever we want it to be, but in our case, let's make it a simple node web api.  

Here's one I prepared earlier! Clone [this repo](https://github.com/kstolen0/sample-node-project) and then navigate to the directory.

Create a new bash script named `build-and-push.sh` and add the following:

```bash
#!/bin/bash

aws --profile [your-aws-cli-profile] ecr get-login-password --region [region] | sudo docker login --username AWS --password-stdin [ecr-uri]
sudo docker build -t unicorn-api .
sudo docker tag unicorn-api:latest [ecr-uri]:latest
sudo docker push [ecr-uri]:latest
aws --profile [your-aws-cli-profile] ecr list-images --repository-name unicorn-api

```
We'll also need to enable read/write/execute permissions on the script in order to run it.

`chmod 700 build-and-push.sh`  

Now run the script and if all went well you should see the following output:


![console output from pushing an image container to ecr](/assets/getting-started-with-aws-tf-02/example-push-ecr-output.png)


## Step 3 - Pull the ECR image onto EC2 instance and run it

By now we should have an EC2 instance running in AWS and a container image hosted on ECR. Now we just need to run the image on our EC2 instance.

In order to achieve this we'll need to:
1. Add a security egress rule to allow EC2 to connect to ECR
2. Define a role to allow read access to ECR and assign it to our EC2 instance
3. write another custom script to run on our instance which will pull the docker image and run it in its own Docker environment 

Lets define our security group rule first.

Open the `unicorn-api.tf` file and add the following egress rule:

```terraform
# /infra/unicorn-api.tf

resource "aws_vpc_security_group_egress_rule" "allow_outgoing_https" {
  
  security_group_id = aws_security_group.unicorn_api_security_group.id

  description = "allow egress via port 443"
  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = "tcp"
  from_port   = 443
  to_port     = 443
}
```

This [security group egress rule](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/vpc_security_group_egress_rule) allows our EC2 instance to make https requests over the internet. ECR operates over HTTPS which is why declare TCP and ports 443.  

You can validate that this changed worked by sshing into you EC2 instance and connecting to a website over https, e.g. `curl https://www.google.com`.  

> Note: We're allowing egress over HTTPS to any node on the internet when we only need to connect to ECR. As we learned in the previous blog post this violates [the principle of least privilege](https://www.cyberark.com/what-is/least-privilege/). There is an alternative to this, which is to create a [VPC Endpoint](https://docs.aws.amazon.com/whitepapers/latest/aws-privatelink/what-are-vpc-endpoints.html) for connecting to the ECR Service and allowing egress to that endpoint but that is beyond the scope of this blog post.

Now that we can connect to ECR, we need to provide access for our EC2 instance to run commands against ECR.

In your `infra` directory create a new file `iam.tf` and add the following:

```terraform
# /infra/iam.tf

resource "aws_iam_role" "ec2_ecr_readonly_role" {
  name               = "ec2-ecr-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role_policy.json

  inline_policy {
    name   = "ecr-read-policy"
    policy = data.aws_iam_policy_document.ec2_container_registry_read_only.json
  }
}

data "aws_iam_policy_document" "ec2_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "ec2_container_registry_read_only" {
  statement {
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = ["*"]
  }
}
```

What we have done is defined an [aws_iam_role](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) and applied a couple of [aws_iam_policy_documents](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) which:

1. Define which services can assume this role (`ec2_assume_role_policy`). In this case only the EC2 service can assume the role
2. Define the actions a service with role can perform (`ec2_container_registry_read_only`). 

Our EC2 service requires three actions:
* one to allow the principal to authenticate with ECR
* one to query the manifest of a container image pulled from ECR
* one to query the download URLs of the the container image layers

We've defined our role and appropriate policies for the role, now we need to apply it to our EC2 instance.

Open `unicorn-api.tf` and add the following resource: 

```terraform
# /infra/unicorn-api.tf

resource "aws_iam_instance_profile" "unicorn_api_iam_profile" {
  name = "unicorn-api-iam-profile"
  role = aws_iam_role.ec2_readonly_role.name
}
```


Now add the [iam instance profile](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_instance_profile) to the aws instance.

```terraform
# /infra/unicorn-api.tf

resource "aws_instance" "unicorn_api" {

  # ...

  iam_instance_profile = aws_iam_instance_profile.unicorn_api_iam_profile.name
 
  # ...
}
```

Great! Now that we've defined the IAM role and applied it to our EC2 resource, we can define a script for our instance to run on start up which will pull the ECR image and run it in docker.

Create a new file in the `infra` directory, `init-unicorn-api.sh`

```bash
#!/bin/bash

aws ecr get-login-password --region [region] | docker login --username AWS --password-stdin [ecr repository url]
docker run -p 80:8080 [ecr repository url]:latest
```

Add the script to the EC2 instance user data property:

```terraform
#! /infra/unicorn-api.tf

resource "aws_iam_instance_profile" "unicorn_api_iam_profile" {
  # ...
  
  user_data = file("${path.module}/init-unicorn-api.sh")

  # ...
}
```

With all that setup, we should now have an EC2 instance running a simple web server listening on port 80. There's just one final step to allow this service to be reachable from any device on the internet.

## Step 4 - Allow any device on the internet to connect to our web server

So far we've created a web service Docker image, pushed the image to ECR, and pulled & run the image on our EC2 instance.  

Now we need to revisit our security group rules and update our ingress rule to allow incoming connections from any IP over port 80. Remove your existing ingress rule and replace it with the following.

```terraform
# /infra/unicorn-api.tf

resource "aws_vpc_security_group_ingress_rule" "allow_incoming_http" {
  security_group_id = aws_security_group.unicorn_api_security_group.id
  description       = "allow ingress via port 80"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

```

With all of that we can run `terraform apply` to apply our changes.  

Copy the EC2 public domain name output into a browser (you may need to prepend `http://` to the address as your browser might assume to use https) and see your awesome website!

![a really really really cool website](/assets/getting-started-with-aws-tf-02/hello-world.png)

In our next post, we'll do some cleanup of our current infrastructure and define our own VPC and subnet instead of using the default resources.

[See here](https://github.com/kstolen0/getting-started-with-aws-tf/tree/post-2) to get the final code output from this post.
