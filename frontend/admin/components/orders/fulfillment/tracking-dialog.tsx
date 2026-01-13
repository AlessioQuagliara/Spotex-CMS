/**
 * Tracking Component
 * Aggiornamento e visualizzazione tracking spedizioni
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Package,
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

interface TrackingEvent {
  timestamp: Date
  status: string
  location?: string
  description: string
}

interface TrackingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  carrier?: string
  trackingNumber?: string
  onUpdate: (carrier: string, trackingNumber: string) => Promise<void>
}

export function TrackingDialog({
  open,
  onOpenChange,
  orderId,
  carrier,
  trackingNumber,
  onUpdate,
}: TrackingDialogProps) {
  const [editMode, setEditMode] = useState(!trackingNumber)
  const [newCarrier, setNewCarrier] = useState(carrier || '')
  const [newTrackingNumber, setNewTrackingNumber] = useState(trackingNumber || '')
  const [isUpdating, setIsUpdating] = useState(false)

  // Mock tracking events
  const [trackingEvents] = useState<TrackingEvent[]>([
    {
      timestamp: new Date('2026-01-11T14:30:00'),
      status: 'delivered',
      location: 'Milano, Italy',
      description: 'Package delivered',
    },
    {
      timestamp: new Date('2026-01-11T09:15:00'),
      status: 'out_for_delivery',
      location: 'Milano Hub',
      description: 'Out for delivery',
    },
    {
      timestamp: new Date('2026-01-11T06:00:00'),
      status: 'in_transit',
      location: 'Milano Hub',
      description: 'Arrived at delivery facility',
    },
    {
      timestamp: new Date('2026-01-10T20:30:00'),
      status: 'in_transit',
      location: 'Bologna Hub',
      description: 'In transit',
    },
    {
      timestamp: new Date('2026-01-10T15:00:00'),
      status: 'picked_up',
      location: 'Roma Warehouse',
      description: 'Package picked up',
    },
  ])

  const handleUpdate = async () => {
    if (!newCarrier || !newTrackingNumber) return

    setIsUpdating(true)
    try {
      await onUpdate(newCarrier, newTrackingNumber)
      setEditMode(false)
    } catch (error) {
      console.error('Tracking update error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getCarrierUrl = (carrier: string, trackingNumber: string) => {
    const urls: Record<string, string> = {
      dhl: `https://www.dhl.com/it-it/home/tracking.html?tracking-id=${trackingNumber}`,
      ups: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      fedex: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      gls: `https://gls-group.eu/IT/it/ricerca-spedizione?match=${trackingNumber}`,
      bartolini: `https://www.brt.it/it/ricerca-spedizione?id=${trackingNumber}`,
      poste: `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${trackingNumber}`,
    }
    return urls[carrier.toLowerCase()] || '#'
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      delivered: CheckCircle,
      out_for_delivery: Truck,
      in_transit: Package,
      picked_up: Package,
      pending: Clock,
      exception: AlertCircle,
    }
    const Icon = icons[status] || Clock
    return Icon
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: 'bg-green-500',
      out_for_delivery: 'bg-blue-500',
      in_transit: 'bg-yellow-500',
      picked_up: 'bg-purple-500',
      pending: 'bg-gray-500',
      exception: 'bg-red-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipment Tracking
          </DialogTitle>
          <DialogDescription>Order {orderId}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {editMode ? (
            /* Edit Mode */
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Enter shipping carrier and tracking number to enable tracking
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier</Label>
                <Input
                  id="carrier"
                  placeholder="e.g., DHL, UPS, FedEx"
                  value={newCarrier}
                  onChange={(e) => setNewCarrier(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking">Tracking Number</Label>
                <Input
                  id="tracking"
                  placeholder="Enter tracking number"
                  value={newTrackingNumber}
                  onChange={(e) => setNewTrackingNumber(e.target.value)}
                />
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-4">
              {/* Tracking Info */}
              <Card className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Carrier</p>
                    <p className="font-medium capitalize">{carrier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">{trackingNumber}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(
                            getCarrierUrl(carrier || '', trackingNumber || ''),
                            '_blank'
                          )
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </Button>
                </div>
              </Card>

              {/* Tracking Timeline */}
              <div className="space-y-3">
                <h4 className="font-semibold">Tracking History</h4>
                <div className="space-y-4">
                  {trackingEvents.map((event, index) => {
                    const Icon = getStatusIcon(event.status)
                    return (
                      <div key={index} className="flex gap-4">
                        <div className="relative">
                          <div
                            className={`w-10 h-10 rounded-full ${getStatusColor(
                              event.status
                            )} bg-opacity-10 flex items-center justify-center`}
                          >
                            <Icon
                              className={`h-5 w-5 ${getStatusColor(
                                event.status
                              ).replace('bg-', 'text-')}`}
                            />
                          </div>
                          {index < trackingEvents.length - 1 && (
                            <div className="absolute top-10 left-5 w-px h-8 bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pt-2">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="font-medium">{event.description}</p>
                              {event.location && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(event.status)} text-white`}
                            >
                              {event.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {event.timestamp.toLocaleString('it-IT', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* External Tracking Link */}
              <Alert>
                <AlertDescription className="flex items-center justify-between">
                  <span>View full tracking details on carrier website</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() =>
                      window.open(
                        getCarrierUrl(carrier || '', trackingNumber || ''),
                        '_blank'
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Track on {carrier}
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {editMode ? 'Cancel' : 'Close'}
          </Button>
          {editMode && (
            <Button
              onClick={handleUpdate}
              disabled={!newCarrier || !newTrackingNumber || isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Save Tracking Info'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
