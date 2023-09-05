import TransactionItem from '@comps/ui/TransactionItem'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { IHistoryEntry } from '@src/model'
import { RootStackParamList } from '@src/model/nav'
import { getLatestHistory } from '@src/storage/store/latestHistoryEntries'
import { useEffect, useState } from 'react'
import { View } from 'react-native'

interface IHistoryProps {
  nav?: NativeStackNavigationProp<RootStackParamList, 'dashboard', 'MyStack'>;
}

export default function History({ nav }: IHistoryProps) {
	const [history, setHistory] = useState<IHistoryEntry[]>([])

	useEffect(() => {
		void (async () => {
			const stored = (await getLatestHistory()).reverse()
			setHistory(stored)
		})()
	}, [])

	// get history after navigating to this page
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		const focusHandler = nav?.addListener('focus', async () => {
			const stored = (await getLatestHistory()).reverse()
			setHistory(stored)
		})
		return focusHandler
	}, [nav])

	return (
		<View style={{ display: 'flex', gap: 12 }}>
			{history.map((h) => (
				<TransactionItem
					key={h.timestamp}
					title={h.type === 2 || h.type === 3 ? 'Lightning' : 'Ecash'}
					timestamp={h.timestamp}
					amount={h.amount}
				/>
			))}
		</View>
	)
}
