/* eslint-disable import/no-extraneous-dependencies */
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { logger } from '@aws-quickstart/eks-blueprints/dist/utils';
import { App, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

const jupyterHubAddOn = new blueprints.addons.JupyterHubAddOn({
  efsConfig: {
    removalPolicy: RemovalPolicy.DESTROY,
    pvcName: 'efs-persist',
    capacity: '120Gi',
  },
  serviceType: blueprints.JupyterHubServiceType.ALB,
  notebookStack: 'jupyter/datascience-notebook',
});

const addOns: Array<blueprints.ClusterAddOn> = [
  // new blueprints.addons.ArgoCDAddOn(),
  // new blueprints.addons.CalicoOperatorAddOn(),
  new blueprints.addons.MetricsServerAddOn(),
  new blueprints.addons.ClusterAutoScalerAddOn(),
  new blueprints.addons.AwsLoadBalancerControllerAddOn(),
  new blueprints.addons.NginxAddOn({ internetFacing: true }),
  new blueprints.addons.EfsCsiDriverAddOn(),
  new blueprints.addons.VpcCniAddOn(),
  new blueprints.addons.CoreDnsAddOn(),
  new blueprints.addons.KubeProxyAddOn(),
  jupyterHubAddOn,
];

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

export default class EKSCluster {
  async buildAsync(scope: Construct, id: string, _props: StackProps) {
    const admin = new blueprints.PlatformTeam({
      name: 'admin-team', // make sure this is unique within organization
      userRoleArn: `arn:aws:iam::${account}:user/schuettc`,
    });

    await blueprints.EksBlueprint.builder()
      .addOns(...addOns)
      .addOns()
      .region(region)
      .account(account)
      .teams(admin)
      .version('auto')
      .build(scope, id);
  }
}

const devEnv = {
  account: account,
  region: region,
};

const app = new App();

new EKSCluster().buildAsync(app, 'eks-cluster', { env: devEnv }).catch(() => {
  logger.info('Error');
});
app.synth();
