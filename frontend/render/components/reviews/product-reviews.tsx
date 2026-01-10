"use client";

import { useState } from "react";
import { useLocalization } from "@/contexts/localization-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ThumbsUp } from "lucide-react";

interface Review {
  id: number;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
  verified: boolean;
}

interface ProductReviewsProps {
  productId: number;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export function ProductReviews({
  productId,
  reviews,
  averageRating,
  totalReviews,
}: ProductReviewsProps) {
  const { t, formatDate } = useLocalization();
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(5);

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer" : ""}`}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    );
  };

  const handleSubmitReview = async () => {
    // API call to submit review
    console.log("Submit review:", { productId, rating, comment: newReview });
    setNewReview("");
    setRating(5);
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t("product.reviews")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
            <div>
              {renderStars(Math.round(averageRating))}
              <p className="text-sm text-muted-foreground mt-1">
                {totalReviews} recensioni
              </p>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter((r) => r.rating === stars).length;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2 text-sm">
                  <span className="w-12">{stars} stelle</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Write Review */}
      <Card>
        <CardHeader>
          <CardTitle>Scrivi una Recensione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              La tua valutazione
            </label>
            {renderStars(rating, true)}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Il tuo commento
            </label>
            <Textarea
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder="Condividi la tua esperienza con questo prodotto..."
              className="min-h-[100px]"
            />
          </div>
          <Button onClick={handleSubmitReview}>Invia Recensione</Button>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={review.avatar} />
                  <AvatarFallback>
                    {review.author.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{review.author}</h4>
                      {review.verified && (
                        <span className="text-xs text-green-600">
                          ✓ Acquisto verificato
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(review.date)}
                    </span>
                  </div>
                  {renderStars(review.rating)}
                  <p className="mt-3 text-sm">{review.comment}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Utile ({review.helpful})
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
