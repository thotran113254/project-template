export interface Hotel {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  starRating: number;
  images: string[];
  amenities: string[];
  priceFrom: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface HotelRoom {
  id: string;
  hotelId: string;
  roomType: string;
  pricePerNight: number;
  capacity: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateHotelDto = {
  name: string;
  description?: string;
  location: string;
  starRating?: number;
  images?: string[];
  amenities?: string[];
  priceFrom?: number;
  metadata?: Record<string, unknown>;
};

export type UpdateHotelDto = Partial<CreateHotelDto>;

export type CreateHotelRoomDto = {
  hotelId: string;
  roomType: string;
  pricePerNight: number;
  capacity?: number;
  description?: string;
};

export type UpdateHotelRoomDto = Partial<Omit<CreateHotelRoomDto, "hotelId">>;

export type HotelQuery = {
  page: number;
  limit: number;
  search?: string;
  location?: string;
  minStars?: number;
  maxPrice?: number;
};
