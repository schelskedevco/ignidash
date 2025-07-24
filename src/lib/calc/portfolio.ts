import { Asset, AssetClass } from './asset';

export class Portfolio {
  constructor(public assets: Asset[]) {}

  getAssetValue(assetClass: AssetClass): number {
    return this.assets.filter((asset) => asset.assetClass === assetClass).reduce((sum, asset) => sum + asset.principal + asset.growth, 0);
  }

  getTotalValue(): number {
    return this.assets.reduce((sum, asset) => sum + asset.principal + asset.growth, 0);
  }
}
