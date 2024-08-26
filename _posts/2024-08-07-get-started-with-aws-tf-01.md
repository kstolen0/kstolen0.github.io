---
layout: post
title: "Getting Started with AWS and Terraform: 01 - Creating an EC2 Instance"
date: 2024-08-07 16:00:00 +0800
categories: aws Terraform infratructure IaC
description: In this multi-part blog series we will learn how to create a modern enterprise ready web service in AWS using Terraform. In this first post we will create an EC2 instance to host our web service in AWS using Terraform
---

# Introduction

In this series of blog posts, we will build an enterprise scale web infrastructure.

Starting small with a simple virtual machine image, iterating as our needs develop until eventually we will have a highly available, secure, and resilient web infrastructure capable of meeting the needs of tens of customers! 

All of this will be managed with the popular Infrastructure As Code tool, Terraform.  

In this first post, we will:
 1. Configure Terraform with a pre-existing AWS account
 2. Deploy an EC2 instance to AWS
 3. Allow incoming connections to the EC2 instance from our local device
 4. SSH into our EC2 instance using a ssh key pair

## Prerequisites

It would be helpful for you to have some familiarity with the following concepts/tools:
* What [Infrastructure as Code](https://aws.amazon.com/what-is/iac/) (IaC) is and some IaC tools (e.g. Terraform, Pulumi, CloudFormation)
* What a [cloud service provider](https://azure.microsoft.com/en-au/resources/cloud-computing-dictionary/what-is-a-cloud-provider) is (e.g. AWS, Google Cloud, Azure)
* Familiarity with using the terminal

Before we start building, you'll want to have setup a couple things:

1. Have an [AWS Account](https://aws.amazon.com/free/) setup
2. Installed [Terraform cli](https://developer.hashicorp.com/terraform/install?product_intent=terraform)
3. An IDE or text editor of your preference (I use Neovim, btw)

## Step 0 - Create a directory for your project

As we'll be building our infrastructure using Terraform, we'll need somewhere to write this code.
Let's create a directory called `my-unicorn-project` and inside that directory create another directory called `infra`.

## Step 1 - Define our Terraform provider

Now we will create our `main.tf` file inside our `infra` directory where we will define our cloud provider.

```terraform
# /infra/main.tf

terraform {
  required_version = ">= 1.2.0"
  required_providers {
    aws = {
            source = "hashicorp/aws"
            version = ">= 5.41.0"
        }
    }
}
```

Open a terminal in the `infra` directory and run [terraform init](https://developer.hashicorp.com/terraform/cli/commands/init). Terraform will download the required provider modules so they can be used to configure our services.


## Step 2 - Create an AWS EC2 instance

Now we have successfully initialized Terraform with the AWS provider we can define AWS resources in our code. In this step we will create three things:
1. An AWS [EC2 instance](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html) resource
2. An AWS [Amazon Machine Image](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html) (ami) data reference for EC2 to run
3. A [Terraform output](https://developer.hashicorp.com/terraform/language/values/outputs) to return the public ip address for the created EC2 instance so we can easily connect to it

Create a new file called `unicorn-api.tf`.  
Inside the file, add:

```terraform
# /infra/unicorn-api.tf

data "aws_ami" "amazon_x86_image" {
    most_recent = true
    owners = ["amazon"]
    name_regex = "^al2023-ami-ecs.*"

    filter {
        name = "architecure"
        values = ["x86_64"]
    }
}

resource "aws_instance" "unicorn_vm" {
    ami = data.aws_ami.amazon_x86_image.id
    instance_type = "t2.micro"

    tags = {
        Name = "Unicorn"
    }
}

output "unicorn_vm_public_ip" {
  description = "Public IP address of the unicorn vm"
  value = aws_instance.unicorn_vm.public_ip
}
```

In this file We've defined an AWS EC2 [resource](https://developer.hashicorp.com/terraform/language/resources) and attached an AWS AMI [data source](https://developer.hashicorp.com/terraform/language/data-sources) with an x86 architecture and has docker pre-installed on the image to install onto the EC2 instance.  

We've also defined an [output](https://developer.hashicorp.com/terraform/language/values/outputs) which returns the EC2 instance's public ip address. We'll need this later.

Now when you open the terminal and run [terraform plan](https://developer.hashicorp.com/terraform/cli/commands/plan) to review the proposed changes prior to applying them.

It fails! But why?

Even though we've created an AWS account, and downloaded Terraform, and the AWS provider for Terraform to use, we still need Terraform to authenticate with AWS in order to create these resources.

## Step 2.1 - Create an AWS API Key for Terraform

In order for Terraform to manage resources in AWS it needs access to your AWS account. We can accomplish this by creating credentials specifically for this project and configuring Terraform to use those credentials to create and manage resources.

Create a new file called `aws-provider-key.tf` and add the following content:

```terraform
# /infra/aws-provider-key.tf

provider "aws" {
    access_key = ""
    secret_key = ""
    region = "ap-southeast-2"
}
```

You can select a region closer to you. As I'm in Australia I'm opting to use the Australian region. [See here](https://aws.amazon.com/about-aws/global-infrastructure/regions_az/) to find out what other regions AWS have available and pick the one closest to you.

Next you need to create two things in the AWS Management Console:
1. Create a [new User](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html) with administrator permission
2. Create an [access key](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html) for the user

> Note, giving users more access than they require (such as admin access) is not good practice. Users should only ever be given the mininum level of access in order to complete a task. I'll leave it as an exercise to the reader to find out the minimum required roles should be for this user. For more information about the principle of least privilege, [see here](https://www.cyberark.com/what-is/least-privilege/).

Take the access key and corresponding secret key and add them to your provider key you defined earlier.

> These API keys should be treated like credentials. Do not commit this file to source control. Otherwise the key could be discovered and you'll need to replace them.

Now try running `terraform plan` once more. Your output should look something like this:

![output from the Terraform plan command](/assets/getting-started-with-aws-tf-01/example-plan.png)

Now run [terraform apply](https://developer.hashicorp.com/terraform/cli/commands/apply) to deploy this EC2 resource to AWS.

## Step 3 - Connect to our EC2 Instance

If you've made it this far it means you've successfully configured Terraform with an AWS account and have deployed an EC2 instance to AWS. Nice!  

Let's try connect to this instance.  

You can see the public ip address of the as one of the outputs from the apply step. Alternatively, you can also run [terraform output](https://developer.hashicorp.com/terraform/cli/commands/output) to print all the outputs from the project.

Copy the IP address and in a terminal run `ping <the-ip-address>`.

No response...  

This is because when we define the EC2 instance, a default [security group](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html) is applied to it. This security group allows incoming connections on any port using any protocol but only from other AWS resources within the same security group...

If we want to connect to our instance, we need to make our own rules.

We don't want just anyone to connect to this service so for now we'll only allow our local device's public ip address in the address range. You can find this easily using a site like [whatismyipaddress.com](https://www.whatismyipaddress.com). 

Open `unicon-api.tf` and add the following resources, providing your public ip for `cidr_ipv4` value:

```terraform
# /infra/unicorn-api.tf

resource "aws_security_group" "unicorn_api_security_group" {
  name = "unicorn-api-security-group"
}

resource "aws_vpc_security_group_ingress_rule" "allow_from_local_device" {
  security_group_id = aws_security_group.unicorn_api_security_group.id
  description       = "allow ingress on any port from any ip"
  cidr_ipv4         = "<YOUR_IP_ADDRESS_HERE>/32"
  ip_protocol       = -1
}
```

This rule allows an incoming connection on any port using any protocol but only from the defined ip address range.  

Next, apply the security group to the EC2 instance, adding the following property to the EC2 instance:

```terraform 
# /infra/unicorn-api.tf

resource "aws_instance" "unicorn_vm" {

    # ...

  vpc_security_group_ids = [aws_security_group.unicorn_api_security_group.id]
}
```

With these new resources defined, we can re-apply our changes with `terraform apply`. This will rebuild the EC2 instance, so we'll need to get the latest ip address to ping it.  

Once the resources have been updated and the latest IP address copied, we can now ping our EC2 instance with:  

`ping <the-ip-address>`

![output from successfully applying the Terraform config and pinging the vm](/assets/getting-started-with-aws-tf-01/example-ping.png)

## Step 4 - SSH into the EC2 Instance

Before we move on it's good practice when experimenting with Terraform and public cloud resources to not leave those resources active otherwise you might run up a surprising bill. 

What we've created so far isn't so expensive but to get used to the habit let's quickly destroy these resources by running [terraform destroy](https://developer.hashicorp.com/terraform/cli/commands/destroy).

---

In this step we're going to create an ssh key pair using Terraform. The public key will be added to the EC2 instance as one of its known ssh public keys.  

We'll save the private key as a local file so we can reference it when we try connect to the EC2 instance.

First, add the following providers to our `main.tf`:

```terraform
# infra/main.tf

required_providers {

    # ...

    tls = {
          source  = "hashicorp/tls"
          version = "~> 4.0.4"
        }

    local = {
      source  = "hashicorp/local"
      version = "2.4.1"
    }
}
```

Above we're adding two new providers to our Terraform config: 
* [tls](https://registry.terraform.io/providers/hashicorp/tls/latest/docs), which allows us to create TLS private keys and certificates
* [local](https://registry.terraform.io/providers/hashicorp/local/latest/docs), which allows us to manage local resources (such as creating new files) via Terraform  

Since we've added new providers, we need to run `terraform init` to download their modules.  

Create a new file named `ssh_key.tf` and add the following:

```terraform
# infra/ssh_key.tf

# create a tls key pair using rsa algorithm
resource "tls_private_key" "ssh_key" {
    algorithm = "RSA"
    rsa_bits = 4096
}

# save the private key to a local file named "key.pem"
resource "local_file" "rsa_key" {
    content = tls_private_key.ssh_key.private_key_openssh
    filename = "${path.module}/key.pem"
    file_permission = "0600"
}

# define an AWS key pair, providing the public key from the tls key pair defined above
resource "aws_key_pair" "key_pair_for_ec2_instance" {
    key_name = "ssh-key"
    public_key = tls_private_key.ssh_key.public_key_openssh
}
```

Above we've just:
1. Created a tls private key resource
2. Created a local file with the file name `key.pem` and added the ssh private key to its contents
3. An [AWS key pair](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/key_pair) resource which will register the ssh public key to our aws EC2 instance

Now, add the key pair to our EC2 instance and while we're at it, lets add the instance's public dns name as an output for when we ssh into it:

```terraform
# infra/unicorn-api.tf

resource "aws_instance" "web_service_vm" {

    # ...

  key_name = aws_key_pair.key_pair_for_ec2_instance.key_name
}

output "unicorn_vm_public_dns_name" {
    description = "Public DNS name of the unicorn vm"
    value = aws_instance.unicorn_vm.public_dns
}
```

> Note: As the name suggests, the tls private key should be treated like any other credentials and not be committed to version control. It should also be worth noting that when creating a private key in Terraform [the key is store unencrypted in the Terraform state backup file](http://localhost:4000/aws/terraform/infratructure/iac/2024/05/17/get-started-with-aws-tf-01.html). With this in mind, for this exercise I would suggest ignoring both `key.pem` and `terraform.tfstate.backup` from your version control. For production workloads, the key pair can be generated outside of Terraform, and only the public key shared.

Now run `terraform apply`, copy the dns name output value and then in a console run:  
`ssh ec2-user@<EC2-DNS-NAME> -i 'key.pem'`. 

![the output from successfuly sshing into an AWS hosted vm](/assets/getting-started-with-aws-tf-01/example-ssh.png)
And voila! You've successfully:
 * Deployed a virtual machine instance to a public cloud environment
 * Confiured network security rules on the instance to accept incoming connections from only your device
 * Configured an ssh key pair for the instance and ssh'd onto the instance 
 * Done it all in Terraform so these steps can be easily repeated with just a single command!

Now again run `terraform destroy` so you don't wake up in a month's time with a shocking bill from AWS!

In the next post we will update our EC2 instance to build and run a web server that can be accessed from any web browser.

[See here](https://github.com/kstolen0/getting-started-with-aws-tf/tree/post-1) for the final code output from this post.

## Bonus Step!

In order to both ping and ssh into our EC2 instance we created a custom security rule that allowed any kind of connection from our public ip address to the EC2 instance.

However, in most cases we don't want our rules to be this lose (remember the [principle of least privilege](https://www.cyberark.com/what-is/least-privilege/)). How might you change your security group rule to only allow ssh connections to the instance?
