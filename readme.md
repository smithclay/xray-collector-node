# xray-collector-node

This code turns AWS X-Ray Trace into New Relic Insights Events for analysis.

This is not an official New Relic project and not supported by New Relic. It is for demonstration purposes only.

![architecture](https://user-images.githubusercontent.com/27153/27302360-9950ac90-54eb-11e7-9d55-8d233ae02fd8.png)

## Installation

This project uses [Terraform](https://terraform.io) to create the Lambda function and associated Cloudwatch rule. 

To build the function deployment archive:

```sh
  $ make lambda
``

To create a plan:
```sh
  $ terraform plan
```

To commit the plan and create the Lambda functions:
```sh
  $ terraform apply
```

## Usage

After running terraform, this function will automatically be invoked every `collection_interval_mins` minutes and collect up to five traces.

The data will then be available in New Relic Insights.

## To do

- [] Trace filtering
- [] Collecting more traces (> 5, need to add pagination support).
