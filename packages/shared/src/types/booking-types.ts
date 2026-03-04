export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  userId: string;
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: BookingStatus;
  totalPrice: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateBookingDto = {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  notes?: string;
};

export type UpdateBookingDto = {
  status?: BookingStatus;
  notes?: string;
  guests?: number;
};
