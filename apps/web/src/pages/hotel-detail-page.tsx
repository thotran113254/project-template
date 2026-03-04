import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { MapPin, Star, Users, MessageSquare, ChevronRight, Wifi, Utensils, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSpinner } from "@/components/ui/spinner";
import { HotelGallery } from "@/components/hotels/hotel-gallery";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Hotel, HotelRoom, ApiResponse, PaginatedResponse } from "@app/shared";

const HIGHLIGHT_ICONS = [MapPin, Star, Wifi, Utensils, Car];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("h-4 w-4", i < rating ? "fill-teal-500 text-teal-500" : "fill-none text-gray-300")}
        />
      ))}
    </div>
  );
}

function RoomCard({ room }: { room: HotelRoom }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] p-4">
      <div className="flex-1">
        <h4 className="font-semibold text-[var(--foreground)]">{room.roomType}</h4>
        {room.description && (
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)] line-clamp-2">{room.description}</p>
        )}
        <div className="mt-1 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
          <Users className="h-3.5 w-3.5" />
          <span>Up to {room.capacity ?? 2} guests</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <p className="text-lg font-bold text-teal-600">
          ${room.pricePerNight}
          <span className="ml-1 text-xs font-normal text-[var(--muted-foreground)]">/night</span>
        </p>
        <Link
          to={`/hotels/rooms/${room.id}`}
          className="text-xs font-medium text-teal-600 underline-offset-2 hover:underline"
        >
          View details
        </Link>
      </div>
    </div>
  );
}

/** Hotel detail page with gallery, description, highlights, CTA, and rooms. */
export default function HotelDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: hotel, isLoading, isError } = useQuery({
    queryKey: ["hotel", slug],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Hotel>>(`/hotels/slug/${slug}`);
      return res.data.data!;
    },
    enabled: !!slug,
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["hotel-rooms", hotel?.id],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<HotelRoom>>(`/hotels/${hotel!.id}/rooms`);
      return res.data.data ?? [];
    },
    enabled: !!hotel?.id,
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !hotel) {
    return (
      <div className="py-20 text-center">
        <p className="text-[var(--foreground)] font-medium">Hotel not found.</p>
        <Link to="/hotels" className="mt-2 inline-block text-sm text-teal-600 hover:underline">
          Back to hotels
        </Link>
      </div>
    );
  }

  const highlights = (hotel.amenities ?? []).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
        <Link to="/" className="hover:text-teal-600">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/hotels" className="hover:text-teal-600">Hotels</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--foreground)] font-medium line-clamp-1">{hotel.name}</span>
      </nav>

      {/* Hotel name + meta */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">{hotel.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <StarDisplay rating={hotel.starRating ?? 0} />
          <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
            <MapPin className="h-4 w-4" />
            <span>{hotel.location}</span>
          </div>
          <Badge variant="secondary" className="text-teal-700 bg-teal-50">
            From ${hotel.priceFrom ?? 0}/night
          </Badge>
        </div>
      </div>

      {/* Gallery */}
      <HotelGallery images={hotel.images ?? []} altPrefix={hotel.name} />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Description */}
          {hotel.description && (
            <section>
              <h2 className="mb-3 text-xl font-semibold text-[var(--foreground)]">About</h2>
              <p className="leading-relaxed text-[var(--muted-foreground)]">{hotel.description}</p>
            </section>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">Highlights</h2>
              <div className="flex flex-wrap gap-3">
                {highlights.map((amenity, idx) => {
                  const Icon = HIGHLIGHT_ICONS[idx % HIGHLIGHT_ICONS.length] ?? MapPin;
                  return (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-800"
                    >
                      <Icon className="h-4 w-4 text-teal-600" />
                      <span>{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Rooms */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">Room Types</h2>
            {roomsLoading ? (
              <p className="text-sm text-[var(--muted-foreground)]">Loading rooms...</p>
            ) : rooms && rooms.length > 0 ? (
              <div className="space-y-3">
                {rooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">No rooms available.</p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Policies */}
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 font-semibold text-[var(--foreground)]">Policies</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Check-in</span>
                  <span className="font-medium text-[var(--foreground)]">From 3:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Check-out</span>
                  <span className="font-medium text-[var(--foreground)]">Until 12:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Cancellation</span>
                  <span className="font-medium text-[var(--foreground)]">Free up to 48h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI CTA */}
          <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-teal-600" />
                <h3 className="font-semibold text-teal-900">
                  Experience {hotel.location.split(",")[0]}
                </h3>
              </div>
              <p className="mb-4 text-sm text-teal-800">
                Talk with our AI assistant to get insider recommendations for your trip.
              </p>
              <Link to="/chat">
                <Button className="w-full bg-teal-600 hover:bg-teal-700">
                  Plan my trip
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
