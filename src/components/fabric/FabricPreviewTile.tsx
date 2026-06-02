interface Props {
  imageUrl: string
  size?: number
  className?: string
  tileSize?: number
}

export default function FabricPreviewTile({
  imageUrl,
  size = 80,
  tileSize = 80,
  className = '',
}: Props) {
  return (
    <div
      className={`rounded-xl overflow-hidden flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${imageUrl})`,
        backgroundRepeat: 'repeat',
        backgroundSize: `${tileSize}px ${tileSize}px`,
      }}
    />
  )
}
