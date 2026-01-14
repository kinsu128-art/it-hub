// IP 주소 검증
export function isValidIp(ip: string): boolean {
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

// 서브넷 마스크 검증
export function isValidSubnetMask(mask: string): boolean {
  if (!isValidIp(mask)) return false;

  const validMasks = [
    '255.255.255.255', '255.255.255.254', '255.255.255.252', '255.255.255.248',
    '255.255.255.240', '255.255.255.224', '255.255.255.192', '255.255.255.128',
    '255.255.255.0', '255.255.254.0', '255.255.252.0', '255.255.248.0',
    '255.255.240.0', '255.255.224.0', '255.255.192.0', '255.255.128.0',
    '255.255.0.0', '255.254.0.0', '255.252.0.0', '255.248.0.0',
    '255.240.0.0', '255.224.0.0', '255.192.0.0', '255.128.0.0',
    '255.0.0.0', '254.0.0.0', '252.0.0.0', '248.0.0.0',
    '240.0.0.0', '224.0.0.0', '192.0.0.0', '128.0.0.0', '0.0.0.0'
  ];

  return validMasks.includes(mask);
}

// IP 범위 계산
export function getIpRange(ip: string, subnetMask: string): { start: string; end: string } | null {
  if (!isValidIp(ip) || !isValidSubnetMask(subnetMask)) return null;

  const ipParts = ip.split('.').map(Number);
  const maskParts = subnetMask.split('.').map(Number);

  const networkParts = ipParts.map((part, i) => part & maskParts[i]);
  const broadcastParts = ipParts.map((part, i) => part | (~maskParts[i] & 255));

  return {
    start: networkParts.join('.'),
    end: broadcastParts.join('.'),
  };
}
