---
layout: post
title: "Getting Started with AWS and Terraform: 03 - Adding a custom domain name to our web service"
date: 2024-09-15 16:00:00 +0800
categories: aws Terraform infratructure IaC domain name hosted zone
description: In this multi-part blog series we will learn how to create a modern enterprise ready web service in AWS using Terraform. In this post, we will configure a domain name for our web service
---

hello again! It's good you're still with us.  

If you've been following along with this blog series by now you should have your very own web api accessible over the internet for anyone to visit.  

Maybe you've even made changes to the api and showed your friends!  

If so then you're probably sick of having to send your friends new domain names/IP addresses after each change.  

If that's the case then you're in luck! Because today we'll be adding a custom domain name to our web service!  

If you're not sick of sending your friends new domain names every time you change your api then please proceed to the next blog post.. 

# Pre-requisites

* Have a registered domain name
* Read and have been following along with the previous two entries in this blog series

# What is a domain name and how does it work?

A domain name is simply a human readable alias for an IP address. These aliases are mapped back to their associated IP address via a Domain Name Resolver.

All domains are children of their top-level domains, e.g. .com, .net, .org, etc.

When entering a domain name in a browser, the client will consult the relevant domain name resolver. 
1. The resolver will start by asking one of the IANA-maintained root name servers for the IP address of the domain.
2. The root name server will examine the top level domain and return the resolver for that name server.
3. The resolver will then ask that name server for the the IP address which will examine the domain portion and direct the resolver to ask the domain's name server. 
4. Finally the resolver will ask the domain name server for the IP address corresponding to the domain name. 
5. The browser will establish a connection to this IP address and retrieve the web page.

[add example diagram]()

There are a number of ways we could assign a domain name to our web server. Let's focus on three approaches that increase in complexity and resiliency.

# The simplest approach

The simplest way to configure a custom domain name for your web service is to deploy your web service, take the public IPv4 address and add it as an A record to your domain registrar's DNS. e.g.

type | host | value | TTL
--- | --- | --- | ---
A Record | www | 127.0.0.1 | 30min

The `A` in A record stands for `Address` and is the most fundamental type of address record. 

When the browser asks to resolve the IP address for a domain name, the resolver ultimately asks for the A resource record.

The above A record for `your-domain.com` maps `www.your-domain.com` to `127.0.0.1`.

If you'd want to configure a sub-domain instead, such as `api.your-domain.com` then you would set the host to `api`.

This will make it easier for people to visit your site, at least until you need to deploy a change.  

At which point you will need to log back in to your domain registrar and update your A record with your new EC2 IP address... And even then any clients who recently visited your site will have cached the IP for at least the duation of the A record's TTL (Time To Live).

# A more sensible approach

Instead of adding our A record directly to our dns hosted zone, we can define our own hosted zone in AWS, add our web server's A record, and add the AWS hosted zone's NS records to our dns hosted zone. 

New app deployments can automatically update the AWS hosted zone A records and as long as we dont redeploy our AWS hosted zone, we wont need to update our dns hosted zone with new NS records. 

In order to achieve this we will once again need to create another Terraform workspace. 

## Creating the hosted zone

Create another directory named `shared` alongside the existing `infra` and `ecr` directories and add the following files, making sure to add your aws api key and the region you're deploying your app to: 

[https://gist.github.com/kstolen0/a86cc2dae0453eac6423acd8d2b7f6ce](https://gist.github.com/kstolen0/a86cc2dae0453eac6423acd8d2b7f6ce)

Dont forget to run `terraform init` to load the providers.  

Next, add a new `tf` file named `unicorn-hosted-zone.tf` and add the following contents: 

```terraform

# /shared/unicorn-hosted-zone.tf

resource "aws_route53_zone" "unicorn" {
    name = "unicorn.<your_domain_name.com>"
}

output "name_servers" {
    description = "name servers for unicorn hosted zone"
    value       = aws_route53_zone.unicorn.name_servers
}

output "zone_id" {
    description = "zone id for unicorn hosted zone for other workspaces to reference"
    value       = aws_route53_zone.unicorn.zone_id
}

```

Now run `terraform apply` to create the hosted zone.

![screenshot output here]()

## Connecting our AWS hosted zone to our DNS hosted zone

Copy the name server records and add them as NS records to your dns hosted zone.

This will look something like: 


type | host | value | TTL
--- | --- | --- | ---
NS Record | unicorn | ns-0000.awsdns-00.org. | Automatic
NS Record | unicorn | ns-0000.awsdns-00.co.uk. | Automatic
NS Record | unicorn | ns-0000.awsdns-00.com. | Automatic
NS Record | unicorn | ns-0000.awsdns-00.net. | Automatic

Now copy the zone id output to be used in for our EC2 instance.

## Connecting our EC2 instance to our AWS hosted zone

Open your `unicorn-api.tf` file and add the following resource:

```terraform
# /infra/unicorn-api.tf

resource "aws_route53_record" "unicorn" {
  zone_id = "" // your zone id here
  name    = "unicorn.<your_domain_name.com>"
  type    = "A"
  ttl     = 300
  records = [aws_instance.unicorn_vm.public_ip]
}
```

This bit of code adds our EC2 instance's public IP address as an A record to our AWS hosted zone.  

Now whenever we deploy our service it's A record will automatically be updated with its new IP address.

We can do better though. As we set our TTL to 300 clients that connect to our web service will cache the IP address for up to 300 seconds so they can avoid doing another IP address lookup. Even if we set our TTL to the smallest possible value It can still take time for the new A record to propogate through these hosted zones which impacts our availability.  

Instead of using our EC2 instance's IP address as our A Record, we can use another, more stable service, the IP for which wont change as often (if at all) and can better handle changes to our EC2 instance.  

I'm talking, of course, about load balancers.

# The most resilient (and complicated) approach

Instead of linking our EC2 service directly to our hosted zone we can instead use an api gateway, the public ip for which is more stable than a constantly changing EC2 service. 

For our API gateway we can create use the AWS Elastic Load Balancer service. We could also use the dedicated API Gateway service however the load balancer will come in handy for our future changes when we want to horizontally scale our services.

To deploy our load balancer we'll need to change our VPC. So far we've been deploying to the default VPC but it's about time we configure our own.

With all these additional services we'll want to create a new Terraform workspace. 

The services we'll be defining to this `shared` workspace are: 
* VPC
* Application Load Balancer
* Hosted Zone


## Define a custom VPC

create `shared` directory and associated AWS provider as in the previous example.

In the `shared` directory create a `vpc.tf` file and add the following content: 

```terraform
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.5.2"
  name    = "unicorn-vpc"

  cidr            = "10.1.0.0/16"
  azs             = ["ap-southeast-2a", "ap-southeast-2b", "ap-southeast-2c"]
  public_subnets  = ["10.1.0.0/19", "10.1.32.0/19", "10.1.64.0/19"]
  private_subnets = ["10.1.96.0/19", "10.1.128.0/19", "10.1.160.0/19"]

  map_public_ip_on_launch = true
  enable_nat_gateway      = true
  single_nat_gateway      = true
  one_nat_gateway_per_az  = false
}
```
Above we've created a simple VPC  using the AWS VPC module.

We provided a rather large cidr block range of 16 bits which allows for 65,536 (2^16) host addresses. 

We've also defined three availability zones, which are all the availability zones in the `ap-southeast-2` region.

We then defined a public and private subnet for each of these zones and allocated 8,192 (2^13) hosts for each subnet. You could adjust these depending on how many hosts you expect each subnet to contain. For example the public subnet may only contain a handful of network devices while the majority of services will be hosted in the private subnet so you could adjust the address spaces accordingly. We wont do that now though..

After defining our CIDR range and subnet though we then toggle some more features.

### map_public_ip_on_launch

Toggling this on means services deployed to the public subnet will automatically be assigned a public subnet and therefore be reachable from the internet. The default for this is false however as we will deploying our load balancer in our public subnet and want it to be reachable over the internet we want this value to be true.

### enable_nat_gateway

Toggling this on provisions a NAT gateway for our private subnet so it will be reachable from our public subnet. As we will be deploying our API to our private subnet and it needs to be reachable from our load balancer in our public subnet we want this toggled on. 

The default value for this is false.

### single_nat_gateway

Toggling this on means that all (3) of our private subnets will share a single NAT gateway. This keeps our network architecture simpler but you may want multiple NAT gateways for your subnets to configure rules. For now we're happy to keep things simple. 

The default value for this is false.

### one_nat_gateway_per_az

As the name suggests this input would define a separate NAT gateway for each AZ we've defined (3). Setting this to true would conflict with our previous configuration so we're intentionally setting it to false.

It just so happens that the default for this is also false.

Now we've configured our VPC and understand all the inputs we've provided it's time to define our load balancer!

## Defining the load balancer

Again in the shared directory create a file named `alb.tf` and add the following contents:

```terraform
resource "aws_lb" "unicorn_alb" {
  name               = "unicorn-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_security_group.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = false
}
```
This is our application load balancer. We've given it a name, and set internal to `false` as this is for public requests. We've set load balancer type to `application` as we'll be handling requests on the http layer. Alternatively we could define a `network` load balancer which operates on a lower level of the OSI stack. This would allow for more fine grained controls and potential optimisations but with added complexity. 

An application load balancer is generally suitable for most architectures.

We've also supplied a security group (which we are yet to define) and added the load balancer to our public subnets. 

We've also disabled deletion protection so we can destroy the service via terraform.

Next we will define a listener so the load balancer can listen for requests on a specified port.

```terraform
resource "aws_alb_listener" "port_80_listener" {
  load_balancer_arn = aws_lb.unicorn_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "not found"
      status_code  = "404"
    }
  }
}
```

This listener resource defines a listener for our load balancer which listens for requests on port 80. 
If it recieves a request it cannot handle it will return a 404 response with a message body of `not found`.

Next we can define our security group rules for our load balancer.

```terraform
resource "aws_security_group" "alb_security_group" {
  name   = "alb-security-group"
  vpc_id = module.vpc.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "port_80_ingress" {
  security_group_id = aws_security_group.alb_security_group.id
  description       = "allow ingress from the internet on port 80"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}
```

This should be fairly familiar. We're simply allowing any request on port 80. 

One key difference between this security group and our previous implementations is that we're also providing the vpc id for our custom vpc. Not providing this would create the security group in the default vpc and it could not be attached to our load balancer as they would be in different vpcs.

Our next step is to define our hosted zone like we did in the previous example but instead of adding our EC2 dns we'll instead add the load balancer. 

```terraform
resource "aws_route53_zone" "unicorn" {
  name = "unicorn.kristianstolen.com"
}

resource "aws_route53_record" "alb_a_record" {
  zone_id = aws_route53_zone.unicorn.zone_id
  name    = "YOUR.DOMAIN.HERE"
  type    = "A"

  alias {
    name                   = aws_lb.unicorn_alb.dns_name
    zone_id                = aws_lb.unicorn_alb.zone_id
    evaluate_target_health = false
  }
}

```

Now, we're almost ready to start updating our API workspace but before we do we're going to need a few outputs to reference from our shared workspace. To keep things a little organised lets create a dedicated `outputs.tf` file and add the following contents:

```terraform
output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "the vpc id"
}

output "private_subnet" {
  value       = module.vpc.private_subnets[0]
  description = "private subnets to be used by other services outside the workspace"
}

output "name_servers" {
  description = "name servers for unicorn subdomain"
  value       = aws_route53_zone.unicorn.name_servers
}

output "unicorn_alb_security_group_id" {
  value       = aws_security_group.alb_security_group.id
  description = "The ALB security group id. Use this to enable egress to your service"
}

output "aws_alb_port_80_listener_arn" {
  value       = aws_alb_listener.port_80_listener.arn
  description = "arn for alb port 80 listener"
}
```

Now with those outputs defined lets apply these changes so we can use the outputs when updating our EC2 instance.

## Updating our EC2 instance

Let's jump back to our API `infra` workspace.

Before we start haphazardly hard coding references to our shared infrastructure, lets try keep things organised and define some variables to use for our shared infra outputs.

Create a new file called `variables.tf` and add the following contents, making sure to change the default values with the output values from your `shared` workspace.

```terraform
variable "vpc_id" {
  type    = string
  default = "YOUR VPC ID OUTPUT"
}

variable "private_subnet" {
  type    = string
  default = "YOUR PRIVATE SUBNET OUTPUT"
}

variable "unicorn_alb_security_group_id" {
  type    = string
  default = "YOUR ALB SECURITY GROUP ID OUTPUT"
}

variable "aws_alb_port_80_listener_arn" {
  type    = string
  default = "YOUR ALB LISTENER ARN OUTPUT"
}
```

Now instead of hardcoding these values everywhere, the workspace can just reference these variables, so if they need to be updated, you only need to change them in one place.

Next we can create our target group attachments so our ALB can forward traffic to our EC2 instance.

Create a new file named `target-group.tf` and add the following contents:

```terraform
resource "aws_lb_target_group" "unicorn_api_target_group" {
  name     = "unicorn-api-target-group"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id
}

resource "aws_lb_target_group_attachment" "unicorn_api_target_group_attachment" {
  target_group_arn = aws_lb_target_group.unicorn_api_target_group.arn
  target_id        = aws_instance.unicorn_vm.id
  port             = 80
}

resource "aws_lb_listener_rule" "forward_to_api" {
  listener_arn = var.aws_alb_port_80_listener_arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.unicorn_api_target_group.arn
  }

  condition {
    path_pattern {
      values = ["*"]
    }
  }
}
```

First we define a target group within our custom VPC which operates on port 80 and communicates via HTTP.

We then create a target group attachment to attach our EC2 instance to the target group.

We then define a listener rule for our ALB listener which forwards traffic to the target group. If we had multiple services and wanted to apply path based routing we could specify a path condition (such as `/unicorn`) but as we only have one service we dont need to worry about that right now.


Next let's update our security group so that it's defined inside our VPC and add an egress rule to our ALB to allow egress to our EC2 instance.  

While we're at it, let's move our security group and its rules to its own file named `security-groups.tf`.

```terraform
resource "aws_security_group" "unicorn_api_security_group" {
  name   = "unicorn-api-security-group"
  vpc_id = var.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "allow_incoming_http" {
  security_group_id = aws_security_group.unicorn_api_security_group.id
  description       = "allow ingress via port 80"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_egress_rule" "allow_outgoing_https" {
  security_group_id = aws_security_group.unicorn_api_security_group.id

  description = "allow egress via port 443"
  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = "tcp"
  from_port   = 443
  to_port     = 443
}

# Allow egress from the ALB security group to any services in the unicorn api security group
resource "aws_vpc_security_group_egress_rule" "alb_to_ec2_rule" {
  security_group_id            = var.unicorn_alb_security_group_id
  description                  = "Allow egress from the ALB to services in this security group"
  referenced_security_group_id = aws_security_group.unicorn_api_security_group.id
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
}

```

Finally we just need to make one small change to our EC2 configuration which is to specify which subnet we will deploy it to. This can be added to our `unicorn_vm` resource defined in `unicorn-api.tf`:

```terraform
resource "aws_instance" "unicorn_vm" {
  ami           = data.aws_ami.amazon_x86_image.id
  instance_type = "t2.micro"

  subnet_id              = var.private_subnet
  vpc_security_group_ids = [aws_security_group.unicorn_api_security_group.id]
  key_name               = aws_key_pair.key_pair_for_ec2_instance.key_name
  iam_instance_profile   = aws_iam_instance_profile.unicorn_api_iam_profile.name
  user_data              = file("${path.module}/init-unicorn-api.sh")

  tags = {
    Name = "Unicorn"
  }
}
```

