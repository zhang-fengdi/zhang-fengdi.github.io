// performanceScores.js
export async function getRenderScores() {
  const { getGPUTier } = await import('https://unpkg.com/detect-gpu@5.0.70/dist/detect-gpu.esm.js');

  const cpuCores = navigator.hardwareConcurrency || 1;
  const cpuScore = cpuCores * 10;

  let deviceType = 'desktop';
  if (navigator.userAgentData?.mobile !== undefined) {
    deviceType = navigator.userAgentData.mobile ? 'mobile' : 'desktop';
  } else {
    const ua = navigator.userAgent;
    if (/Tablet|iPad/.test(ua)) deviceType = 'tablet';
    else if (/Mobile|Android|iPhone/.test(ua)) deviceType = 'mobile';
  }
  const typeWeights = { mobile:1, tablet:2, desktop:3, server:4 };
  const typeWeight  = typeWeights[deviceType] || 3;
  const typeScore   = typeWeight * 5;

  const canvas = document.createElement('canvas');
  const gl     = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true });
  const { fps } = await getGPUTier({ glContext: gl });

  const targetFPS     = 60;
  const normalizedFPS = Math.min(fps, targetFPS) / targetFPS;
  const maxFPSScore   = 50;
  const fpsScore      = normalizedFPS * maxFPSScore;

  const finalScore = cpuScore + typeScore + fpsScore;

  const midpoint  = 250;
  const steepness = 0.01;
  const mapped    = 1 / (1 + Math.exp(-steepness * (finalScore - midpoint)));

  const lambdas = ['1e-7','2e-7','3e-7','4e-7','5e-7','6e-7','7e-7','8e-7','9e-7','1e-6'];
  const idx = Math.min(
    lambdas.length - 1,
    Math.max(0, Math.round((1 - mapped) * (lambdas.length - 1)))
  );

  // Return all performance scores and recommended lambda value
  return {
    cpuCores,
    cpuScore,
    deviceType,
    typeScore,
    fps,
    normalizedFPS,
    fpsScore,
    finalScore,
    mapped,
    mappedScore: mapped.toFixed(3),
    recommendedLambda: lambdas[idx]
  };
}
