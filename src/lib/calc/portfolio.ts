import { Asset, AssetClass, AssetReturns } from './asset';

export class Portfolio {
  constructor(public assets: Asset[]) {}

  static create(assets: Asset[]): Portfolio {
    return new Portfolio([...assets]);
  }

  getAssetValue(assetClass: AssetClass): number {
    return this.assets.filter((asset) => asset.assetClass === assetClass).reduce((sum, asset) => sum + asset.principal + asset.growth, 0);
  }

  getTotalValue(): number {
    return this.assets.reduce((sum, asset) => sum + asset.principal + asset.growth, 0);
  }

  applyReturns(returns: AssetReturns): Portfolio {
    const updatedAssets = this.assets.map((asset) => {
      const returnRate = returns[asset.assetClass] || 0;
      const currentValue = asset.principal + asset.growth;
      const returnAmount = currentValue * returnRate;

      return {
        ...asset,
        growth: asset.growth + returnAmount, // Returns go to growth
      };
    });

    return new Portfolio(updatedAssets);
  }
}
