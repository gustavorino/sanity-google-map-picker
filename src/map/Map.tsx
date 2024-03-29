import React from 'react'
import {LatLng} from '../types'
import {MapContainer} from './Map.styles'
import {latLngAreEqual} from './util'

interface MapProps {
  api: typeof window.google.maps
  location: LatLng
  bounds?: google.maps.LatLngBounds
  defaultZoom?: number
  mapTypeControl?: boolean
  scrollWheel?: boolean
  controlSize?: number
  onClick?: (event: google.maps.MapMouseEvent) => void
  onZoomChange?: (zoom: number) => void
  children?: (map: google.maps.Map) => React.ReactElement
}

interface MapState {
  map: google.maps.Map | undefined
}

export class GoogleMap extends React.PureComponent<MapProps, MapState> {
  static defaultProps = {
    defaultZoom: 8,
    scrollWheel: true,
  }

  state: MapState = {map: undefined}
  clickHandler: google.maps.MapsEventListener | undefined
  zoomHandler: google.maps.MapsEventListener | undefined
  mapRef = React.createRef<HTMLDivElement>()
  mapEl: HTMLDivElement | null = null

  componentDidMount() {
    this.attachClickHandler()
  }

  attachClickHandler = () => {
    const map = this.state.map
    if (!map) {
      return
    }

    const {api, onClick, onZoomChange} = this.props
    const {event} = api

    if (this.clickHandler) {
      this.clickHandler.remove()
    }

    if (this.zoomHandler) {
      this.zoomHandler.remove()
    }

    if (onClick) {
      this.clickHandler = event.addListener(map, 'click', onClick)
    }
    if (onZoomChange) {
      this.zoomHandler = event.addListener(map, 'zoom_changed', this.onZoomChange)
    }
  }

  componentDidUpdate(prevProps: MapProps) {
    const map = this.state.map
    if (!map) {
      return
    }

    const {onClick, location, bounds} = this.props

    if (prevProps.onClick !== onClick) {
      this.attachClickHandler()
    }

    if (!latLngAreEqual(prevProps.location, location)) {
      map.panTo(this.getCenter())
    }

    if (bounds && (!prevProps.bounds || !bounds.equals(prevProps.bounds))) {
      map.fitBounds(bounds)
    }
  }

  componentWillUnmount() {
    if (this.clickHandler) {
      this.clickHandler.remove()
    }
  }

  getCenter(): google.maps.LatLng {
    const {location, api} = this.props
    return new api.LatLng(location.lat, location.lng)
  }

  constructMap(el: HTMLDivElement) {
    const {defaultZoom, api, mapTypeControl, controlSize, bounds, scrollWheel} = this.props

    const map = new api.Map(el, {
      zoom: defaultZoom,
      center: this.getCenter(),
      scrollwheel: scrollWheel,
      streetViewControl: false,
      mapTypeControl,
      controlSize,
    })

    if (bounds) {
      map.fitBounds(bounds)
    }

    return map
  }

  onZoomChange = () => {
    const zoom = this.state?.map?.getZoom()
    if (this.props.onZoomChange && Number.isInteger(zoom)) {
      this.props.onZoomChange(zoom!)
    }
  }

  setMapElement = (element: HTMLDivElement | null) => {
    if (element && element !== this.mapEl) {
      const map = this.constructMap(element)
      this.setState({map}, this.attachClickHandler)
    }

    this.mapEl = element
  }

  render() {
    const {children} = this.props
    const {map} = this.state
    return (
      <>
        <MapContainer ref={this.setMapElement} />
        {children && map ? children(map) : null}
      </>
    )
  }
}
