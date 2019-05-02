

const {
  inspect
} = require('util')

const {
  construct
} = require('./util')

const {
  pipe
} = require('ramda')

class Stream {
  constructor(produceValues){
		this._produceValues = produceValues
	}

	// -- pointed
	static of(value){
		return new Stream((handler) => {
			handler.next(value)
			handler.complete()
			return () => {} // unsubscribe
		})
	}

	static from(iterable){
		return new Stream((handler) => {
			for(let value of iterable){
				handler.next(value)
			}

			handler.complete()
			return () => {} // unsubscribe
		})
	}

	forEach({ next, error, complete}){
		const noop = () => {}
		return this._produceValues({ 
			next: next || noop, 
			error: error || noop, 
			complete: complete || noop
		}) 
	}

	// -- functor
  map(f){
		return new Stream((handler) => {
			return this._produceValues({
				next: (data) => handler.next(f(data)),
				error: (e) => handler.error(e),
				complete: () => handler.complete()
			})
		})
	}

// -- monad
chain(f){
	return this.map(f).join()
}

join(){
	return new Stream((handler) => {
		return this._produceValues({
			next: (stream) => stream.forEach({ next: handler.next, error: handler.error }),
			error: (e) => handler.error(e),
			complete: () => handler.complete()
		})
	})
}

// -- applicative
ap(stream){
	return this.chain((f) => stream.map(f))
}

// -- utils
  toString() {
    return `Stream(?)`
  }

  [inspect.custom]() {
    return this.toString()
	}

	static create(produceValues) {
		return new Stream(produceValues)
	}
}

module.exports = construct(Stream)