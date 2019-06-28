const G = typeof window !== 'undefined' ? window : self

import DIMBIN from '../src/v3.ts'
import download from 'js-file-download'

G.DIMBIN = DIMBIN
G.download = download
