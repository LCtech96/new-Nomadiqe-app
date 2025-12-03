import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Image from "next/image"
import { MapPin, Users, Bed, Bath, Star, Heart, Share2, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { BookingWidget } from "@/components/property/booking-widget"

interface PropertyPageProps {
  params: {
    id: string
  }
}

async function getProperty(id: string) {
  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    })

    return property
  } catch (error) {
    console.error("Error fetching property:", error)
    return null
  }
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const property = await getProperty(params.id)

  if (!property) {
    notFound()
  }

  const averageRating = property.reviews.length > 0
    ? property.reviews.reduce((acc: number, review: any) => acc + review.rating, 0) / property.reviews.length
    : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <BackButton label="Back" variant="ghost" size="sm" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Property Title and Actions */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {property.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{property.city}, {property.country}</span>
                </div>
                {property.reviews.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{averageRating.toFixed(1)}</span>
                    <span>({property.reviews.length} reviews)</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Images Gallery */}
        {property.images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8 rounded-xl overflow-hidden">
            <div className="relative h-96 md:h-[500px]">
              <Image
                src={property.images[0]}
                alt={property.title}
                fill
                className="object-cover"
              />
            </div>
            {property.images.length > 1 && (
              <div className="grid grid-cols-2 gap-2">
                {property.images.slice(1, 5).map((image: string, index: number) => (
                  <div key={index} className="relative h-48 md:h-[246px]">
                    <Image
                      src={image}
                      alt={`${property.title} ${index + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Info */}
            <div>
              <div className="flex items-center gap-6 pb-6 border-b border-border">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{property.maxGuests} guests</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{property.bedrooms} bedrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{property.bathrooms} bathrooms</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">About this place</h2>
              <p className="text-muted-foreground leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-semibold">Amenities</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {property.amenities.map((amenity: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* House Rules */}
            {property.rules.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-semibold">House Rules</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {property.rules.map((rule: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <span className="text-sm">{rule}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {property.reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-semibold">
                    Reviews ({property.reviews.length})
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {property.reviews.map((review: any, index: number) => (
                      <div key={review.id}>
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.reviewer.image} alt={review.reviewer.name || "User"} />
                            <AvatarFallback className="bg-gradient-to-br from-nomadiqe-primary to-nomadiqe-700 text-white p-1">
                              <Image 
                                src="/nomadiqe-logo-transparent.png" 
                                alt="Nomadiqe" 
                                width={36} 
                                height={36}
                                className="object-contain"
                              />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold">{review.reviewer.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant="secondary" className="gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                {review.rating}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          </div>
                        </div>
                        {index < property.reviews.length - 1 && <Separator className="mt-6" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold">
                      {property.currency === "EUR" ? "€" : "$"}{property.price}
                    </span>
                    <span className="text-muted-foreground">/ night</span>
                  </div>
                  {property.reviews.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {averageRating.toFixed(1)}
                      </Badge>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{property.reviews.length} reviews</span>
                    </div>
                  )}
                </div>

                <BookingWidget
                  propertyId={property.id}
                  hostId={property.host.id}
                  hostName={property.host.name || 'Host'}
                  price={property.price}
                  currency={property.currency}
                  maxGuests={property.maxGuests}
                />

                <Separator className="my-6" />

                {/* Host Info */}
                <div>
                  <h3 className="font-semibold mb-4">Hosted by</h3>
                  <Link href={`/profile/${property.host.id}`}>
                    <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={property.host.image} alt={property.host.name || "Host"} />
                        <AvatarFallback className="bg-gradient-to-br from-nomadiqe-primary to-nomadiqe-700 text-white p-1">
                          <Image 
                            src="/nomadiqe-logo-transparent.png" 
                            alt="Nomadiqe" 
                            width={44} 
                            height={44}
                            className="object-contain"
                          />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{property.host.name}</p>
                        <p className="text-sm text-muted-foreground">View profile</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}