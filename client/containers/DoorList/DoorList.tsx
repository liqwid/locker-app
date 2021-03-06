import * as React from 'react'

import { Subject } from 'rxjs/Subject'
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/takeUntil'

import { Inject } from 'react.di'

import { SUCCESS, ERROR, LOADING, FetchMessage } from 'services/collection'
import { DoorService } from 'services/doors'
import { Door } from 'models/door'
import { List } from 'components/List'

export const ERROR_TEXT: string = 'Failed to load doors. Try again'
export const ADD_TEXT: string = 'Add door'

export interface DoorListProps {
  isAdmin: boolean
}

export interface DoorListState {
  doors: Door[]
  loading: boolean
  error: boolean
}

export class DoorList extends React.Component<DoorListProps, DoorListState> {
  @Inject doorService: DoorService

  unsubscribe$: Subject<void>
  state = {
    doors: [],
    loading: true,
    error: false
  }

  componentDidMount() {
    this.unsubscribe$ = new Subject()
    this.connectDoorService()
  }

  componentWillUnmount() {
    this.unsubscribe$.next()
  }

  connectDoorService() {
    this.doorService.getDataStream()
    // Auto unsubscribe when this.unsubscribe$.next is called
    .takeUntil(this.unsubscribe$)
    .subscribe(({ status, items }: FetchMessage<Door>) => {
      if (status === LOADING) {
        this.setState({ loading: true, error: false, doors: [] })
        return
      }
      if (status === ERROR) {
        this.setState({ loading: false, error: true, doors: [] })
        return
      }
      if (status === SUCCESS) {
        this.setState({ loading: false, error: false, doors: items })
        return
      }
    })

    this.doorService.fetchItems()
  }

  render() {
    const { doors, loading, error } = this.state
    const { isAdmin } = this.props
    
    return (
      <List
        loading={loading}
        error={error}
        onRefresh={this.doorService.fetchItems}
        errorText={ERROR_TEXT}
        addLink={isAdmin ? '/doors/add' : ''}
        addText={ADD_TEXT}
        items={doors.map(({ id, name }: Door) => 
          ({ id, text: name, link: `/doors/${id}/show` })
        )}
      />
    )
  }
}
