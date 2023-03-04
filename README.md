# Description

## **DevOps Take-Home exercise**

### Given instructions:

_Preamble_

1. Assume you’re running on your favorite cloud (Azure, AWS, GCP) - you don’t have to make this work specifically for GCP GKE.
2. Create a README.md that outlines your line of thinking for the solution.
3. Create plain Kubernetes resources (yaml or json). Please return this file in your response with any other materials you want to share with us.
4. You can make the following assumptions:

- Each system you’re deploying has its own isolated database. You don’t have to worry about the type. You can assume the database is in the same region as your k8s.
- You can use any docker image you’d like for your containers. It’s just an example and does not have to work. Any, say, default php docker you can deploy on a pod. What the container it is, does not matter - but we’ll be talking about two different containers in the exercise, one for users, and one for shifts.
- Assume daily bell-curve scaling. High traffic during the day, low traffic during the night.

_Exercise_

1. We want to deploy two containers that scale independently from one another.

- Container 1: This container runs code that runs a small API that returns users from a database.
- Container 2: This container runs code that runs a small API that returns shifts from a database.

2. For the best user experience auto scale this service when the average CPU reaches 70%.

3. Ensure the deployment can handle rolling deployments and rollbacks.

4. Your development team should not be able to run certain commands on your k8s cluster, but you want them to be able to deploy and roll back. What types of IAM controls do you put in place?

_Bonus_

- How would you apply the configs to multiple environments (staging vs production)?

- How would you auto-scale the deployment based on network latency instead of CPU?

# Line of thinking

## Step 1:

Created a mock user API and a mock shifts API using casual and json-server as Development Dependencies on a NodeJS server.

## Step 2:

Created Docker Images for both APIs.

To run these images, you need to download Docker Desktop from https://docs.docker.com/get-docker/

After installing Docker Desktop, run the following commands to download the images:

```
docker run -p 3000:3000 felipetexa/user-api:0.0.1.RELEASE
docker run -p 3001:3001 felipetexa/shifts-api:0.0.1.RELEASE
```

Once it's installed locally, you can visualize the returning data by accessing `localhost:3000/users` and `localhost:3001/shifts` from your browser.

## Step 3:

Created a cluster on Google Cloud Platform, using Google Kubernetes Engine

## Step 4:

Created two Deployments, one for each API.

```
kubectl create deployment user-api --image=felipetexa/user-api:0.0.1.RELEASE .
kubectl create deployment shift-api --image=felipetexa/shifts-api:0.0.1.RELEASE .
```

- PS: It's necessary to install Kubernetes command-line tool, `kubectl`, (https://kubernetes.io/docs/tasks/tools/install-kubectl/) on your local machine.

Since the instructions required independent autoscaling, I separated the Deployments so they can run on different Nodes and deploy different ReplicaSets, that would manage the Pods independently, hence managing scaling separetely.

The structure would follow this sketch:

![alt text][image]

[image]: https://i.imgur.com/3IVSNrp.png 'Image Text'

In this context, I also generated a Service to expose the Deployments to be accessible from the user's browser, using the LoadBalancer type to implement automatic balancing of the Pods:

```
kubectl expose deployment user-api --type=LoadBalancer --port=3000
kubectl expose deployment shift-api --type=LoadBalancer --port=3001
```

After that, I've generated both Deployment and Service's YAML files, merging them into one

## Step 5:

Assured Horizontal Autoscaling for both Deployments, using native scaling tool from Kubernetes:

```
kubectl autoscale deployment user-api --min=3 --max=10 --cpu-percent=70
kubectl autoscale deployment shift-api --min=3 --max=10 --cpu-percent=70
```

To verify the Horizontal Pod Autoscaling, the following command was used:

```
kubectl get hpa
```

I found useful to generate the YAML file for the HPA to merge with the deployment.yaml for each API

## Step 6:

To deal with rolling deployment and rollbacks, I just used the Kubernetes built-in rollback mechanism, disposed on the yaml file like that:

```yaml
strategy:
  rollingUpdate:
    maxSurge: 25%
    maxUnavailable: 25%
  type: RollingUpdate
```

With this feature, if a new release of the APIs were available, a `kubectl set image deployment <name> <name>=<image>` command would be necessary to update the application with the new image of the container.

It would create a new ReplicaSet, responsible for deploying new Pods with the updated version. To avoid instabilities, I've inserted `minReadySeconds: 45` at the .spec.replica, so the new Pods can have sufficient time to be build and deployed without cracking the application.

The previous ReplicaSet wouldn't be deleted, for it's important to rollback the application, in case the new release is somehow malfunctioning. If that's the situation, the `kubectl rollout undo deployment <name> --to-revision=<revision>` command will be invoked.

## Step 7:

Finally, to protect the development team to execute private commands of the Cluster Admin, a RBAC Authentication was created.

The simple solution is to come up with a Role for the developer with `kubectl create role developer -n default --verb=get,list,create,watch,update --resource=""` command. The developer role is now granted with access for an specific namespace and can perform some actions on the project that he or her is assigned.

For that to work, It's also necessary to create a RoleBinding to apply the permissions to specific users or groups of users (called 'devs'), using `kubectl create rolebinding developer --group devs --role developer`.

## Bonus

### 1:

To apply the configs to multiple environments, such as production and development, it's recommended to create different clusters. Although it increases setup, maintenance, costs and administration, it improves the isolation of the production environment and opens space to testing without impacting the version available to the client. It also add some security level, for the administration can limit access to the production cluster. Finally, it allows the team to release with confidence, because all the risky changes would be performed on the development cluster.

### 2:

To autoscale the deployment based on network latency instead of CPU it is necessary to build Custom Metrics with Kubernetes custom metrics API, hence the default metrics are CPU and memory.
